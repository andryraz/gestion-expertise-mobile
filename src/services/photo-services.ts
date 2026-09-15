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

export function getBuildingPhotos(buildingId: string) {
  return apiRequest<Photo[]>(`/buildings/${buildingId}/photos`, {
    auth: true,
  });
}

export function createPhoto(missionId: string, payload: UploadPhotoPayload) {
  return uploadPhotoFile(
    `/missions/${missionId}/photos`,
    {
      uri: payload.uri,
      zoneId: payload.zoneId ?? undefined,
      buildingId: payload.buildingId ?? undefined,
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

async function uploadPhotoFile(
  path: string,
  payload: {
    uri: string;
    zoneId?: string;
    buildingId?: string;
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
        ...(payload.buildingId ? { buildingId: payload.buildingId } : {}),
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

  logger.debug(
    "API",
    `← ${result.status} ${method} ${path} (photo upload)`,
    "OK",
  );
  return data as Photo;
}
