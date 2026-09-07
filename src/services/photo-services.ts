import { File, UploadType } from "expo-file-system";

import { API_URL } from "@/constants/api";
import { ApiError, apiRequest } from "@/services/api-client";
import { getToken } from "@/storage/token-storage";
import type {
  AttachPhotoPayload,
  Photo,
  UpdatePhotoPayload,
  UploadPhotoPayload,
} from "@/types/photo";
import { logger } from "@/utils/logger";

export function getMissionPhotos(missionId: string) {
  return apiRequest<Photo[]>(`/missions/${missionId}/photos`, { auth: true });
}

export function getZonePhotos(zoneId: string) {
  return apiRequest<Photo[]>(`/zones/${zoneId}/photos`, { auth: true });
}

export function getObservationPhotos(observationId: string) {
  return apiRequest<Photo[]>(`/observations/${observationId}/photos`, {
    auth: true,
  });
}

export function createPhoto(missionId: string, payload: UploadPhotoPayload) {
  return uploadPhotoFile(
    `/missions/${missionId}/photos`,
    {
      uri: payload.uri,
      zoneId: payload.zoneId ?? undefined,
      observationId: payload.observationId ?? undefined,
      caption: payload.caption,
      annotation: payload.annotation,
    },
    "POST",
  );
}

export function attachPhoto(photoId: string, payload: AttachPhotoPayload) {
  return apiRequest<Photo>(`/photos/${photoId}/attach`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function updatePhoto(photoId: string, payload: UpdatePhotoPayload) {
  return apiRequest<Photo>(`/photos/${photoId}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deletePhoto(photoId: string) {
  return apiRequest<void>(`/photos/${photoId}`, {
    method: "DELETE",
    auth: true,
  });
}

/**
 * Upload d'une photo via le champ natif `File.upload` (expo-file-system),
 * même mécanisme que les documents de devis : le FormData JS ne sait pas
 * référencer un fichier local de manière fiable sur natif.
 * La photo ne doit jamais être perdue : l'appelant garde l'URI locale
 * jusqu'au succès (voir queries/photos.ts).
 */
async function uploadPhotoFile(
  path: string,
  payload: {
    uri: string;
    zoneId?: string;
    observationId?: string;
    caption?: string;
    annotation?: string;
  },
  method: "POST",
): Promise<Photo> {
  const { uri } = payload;

  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  logger.debug("API", `→ ${method} ${path} (photo upload)`);

  const file = new File(uri);

  let result: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  try {
    result = await file.upload(`${API_URL}${path}`, {
      fieldName: "file",
      httpMethod: method,
      mimeType: "image/jpeg",
      headers,
      uploadType: UploadType.MULTIPART,
      parameters: {
        ...(payload.zoneId ? { zoneId: payload.zoneId } : {}),
        ...(payload.observationId
          ? { observationId: payload.observationId }
          : {}),
        ...(payload.caption ? { caption: payload.caption } : {}),
        ...(payload.annotation ? { annotation: payload.annotation } : {}),
      },
    });
  } catch (err) {
    logger.error(
      "API",
      `← Échec upload photo ${path}`,
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    );
    throw new ApiError(
      0,
      "Impossible d'envoyer la photo. Vérifie ta connexion — elle reste enregistrée sur l'appareil.",
    );
  }

  const data = result.body ? JSON.parse(result.body) : null;

  if (result.status < 200 || result.status >= 300) {
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message;
    logger.error(
      "API",
      `← ${result.status} ${method} ${path} (photo upload)`,
      message,
    );
    throw new ApiError(
      result.status,
      message ?? "Impossible d'envoyer la photo.",
    );
  }

  logger.debug("API", `← ${result.status} ${method} ${path} (photo upload)`, "OK");
  return data as Photo;
}
