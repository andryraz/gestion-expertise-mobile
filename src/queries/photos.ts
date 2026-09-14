import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  attachPhoto,
  createPhoto,
  deletePhoto,
  getMissionPhotos,
  getZonePhotos,
} from "@/services/photo-services";
import type {
  AttachPhotoPayload,
  Photo,
  UploadPhotoPayload,
} from "@/types/photo";

export const photosKeys = {
  all: ["photos"] as const,
  mission: (missionId: string) =>
    [...photosKeys.all, "mission", missionId] as const,
  zone: (zoneId: string) => [...photosKeys.all, "zone", zoneId] as const,
};

export function useMissionPhotos(missionId: string) {
  return useQuery({
    queryKey: photosKeys.mission(missionId),
    queryFn: () => getMissionPhotos(missionId),
    enabled: !!missionId,
  });
}

export function useZonePhotos(zoneId: string) {
  return useQuery({
    queryKey: photosKeys.zone(zoneId),
    queryFn: () => getZonePhotos(zoneId),
    enabled: !!zoneId,
  });
}

/**
 * Construit un placeholder optimiste à partir de la requête d'upload.
 * `filePath` pointe vers l'URI locale (file://) en attendant la réponse
 * du serveur : l'aperçu s'affiche instantanément dans la galerie.
 */
function buildPlaceholder(
  missionId: string,
  payload: UploadPhotoPayload,
): Photo {
  const now = new Date().toISOString();
  return {
    id: `pending-${payload.uri}-${now}`,
    missionId,
    zoneId: payload.zoneId ?? null,
    filePath: payload.uri,
    annotations: null,
    takenAt: now,
    caption: payload.caption ?? null,
    createdAt: now,
  };
}

/**
 * Upload d'une photo avec placeholder optimiste :
 * - la photo apparaît immédiatement dans les galeries concernées
 *   (mission / zone) avec son URI locale ;
 * - en cas d'échec réseau, le placeholder est retiré (rollback) et
 *   l'URI locale est conservée par l'appelant pour relancer l'upload
 *   sans reprendre la photo.
 */
export function useCreatePhoto(missionId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { created: Photo; localUri: string },
    Error,
    UploadPhotoPayload,
    { snapshots: { key: readonly unknown[]; previous: Photo[] | undefined }[] }
  >({
    mutationFn: async (payload) => {
      const created = await createPhoto(missionId, payload);
      return { created, localUri: payload.uri };
    },
    onMutate: async (payload) => {
      const placeholder = buildPlaceholder(missionId, payload);

      const candidateKeys = [
        photosKeys.mission(missionId),
        ...(payload.zoneId ? [photosKeys.zone(payload.zoneId)] : []),
      ];

      const snapshots: {
        key: readonly unknown[];
        previous: Photo[] | undefined;
      }[] = [];

      await Promise.all(
        candidateKeys.map(async (key) => {
          await queryClient.cancelQueries({ queryKey: key });
          const previous = queryClient.getQueryData<Photo[]>(key);
          // On ne place le placeholder que dans les listes déjà chargées :
          // les autres se resynchroniseront d'elles-mêmes au prochain montage.
          if (previous) {
            queryClient.setQueryData<Photo[]>(key, [placeholder, ...previous]);
          }
          snapshots.push({ key, previous });
        }),
      );

      return { snapshots };
    },
    onError: (_err, _payload, context) => {
      // Échec réseau : on retire le placeholder optimiste. L'URI locale de
      // la photo est conservée par l'appelant (pending-photos store) pour
      // permettre une relance sans perdre la photo prise.
      context?.snapshots.forEach(({ key, previous }) => {
        queryClient.setQueryData(key, previous);
      });
    },
    onSuccess: ({ created }, payload, context) => {
      // On remplace le placeholder par la vraie photo renvoyée par le serveur.
      context?.snapshots.forEach(({ key }) => {
        queryClient.setQueryData<Photo[]>(key, (prev) =>
          prev
            ? prev.map((p) =>
                p.filePath === payload.uri && p.id.startsWith("pending-")
                  ? created
                  : p,
              )
            : prev,
        );
      });
    },
    onSettled: () => {
      // Resynchronisation finale avec le serveur.
      queryClient.invalidateQueries({
        queryKey: photosKeys.mission(missionId),
      });
      queryClient.invalidateQueries({ queryKey: photosKeys.all });
    },
  });
}

export function useAttachPhoto(missionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      photoId,
      payload,
    }: {
      photoId: string;
      payload: AttachPhotoPayload;
    }) => attachPhoto(photoId, payload),
    onSuccess: (updated) => {
      // La photo a (peut-être) changé de zone : toutes les galeries
      // doivent se resynchroniser, y compris l'ancienne zone qui ne
      // doit plus afficher la photo.
      queryClient.invalidateQueries({ queryKey: photosKeys.all });
      void updated;
    },
  });
}

export function useDeletePhoto(missionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photosKeys.all });
    },
  });
}
