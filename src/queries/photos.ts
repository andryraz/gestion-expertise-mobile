import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  attachPhoto,
  createPhoto,
  deletePhoto,
  getBuildingPhotos,
  getMissionPhotos,
  getZonePhotos,
  updatePhoto,
} from "@/services/photo-services";
import type {
  AttachPhotoPayload,
  Photo,
  UpdatePhotoPayload,
  UploadPhotoPayload,
} from "@/types/photo";

/**
 * Photo « non classée » : ni zone, ni bâtiment, ni observation.
 * Les photos rattachées à un bâtiment (vue d'ensemble) ne sont PAS
 * non classées — elles vivent dans la galerie du bâtiment.
 */
export function isUnclassifiedPhoto(photo: Photo): boolean {
  if (photo.id.startsWith("pending-")) return false;
  return !photo.zoneId && !photo.buildingId && !photo.observationId;
}

//ensemble standardisé de clés pour React Query
export const photosKeys = {
  all: ["photos"] as const,
  mission: (missionId: string) =>
    [...photosKeys.all, "mission", missionId] as const,
  zone: (zoneId: string) => [...photosKeys.all, "zone", zoneId] as const,
  building: (buildingId: string) =>
    [...photosKeys.all, "building", buildingId] as const,
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

export function useBuildingPhotos(buildingId: string) {
  return useQuery({
    queryKey: photosKeys.building(buildingId),
    queryFn: () => getBuildingPhotos(buildingId),
    enabled: !!buildingId,
  });
}

function buildPlaceholder(
  missionId: string,
  payload: UploadPhotoPayload,
): Photo {
  const now = new Date().toISOString();
  return {
    id: `pending-${payload.uri}-${now}`,
    missionId,
    zoneId: payload.zoneId ?? null,
    buildingId: payload.buildingId ?? null,
    filePath: payload.uri,
    annotations: null,
    takenAt: now,
    caption: payload.caption ?? null,
    createdAt: now,
  };
}

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
      if (!payload.buildingId) {
        return { created, localUri: payload.uri };
      }
      // L'API accepte désormais buildingId à la création : la photo arrive
      // directement rattachée au bâtiment. `attach` ne sert plus que de
      // rattrapage si le serveur renvoie la photo sans buildingId (ancienne
      // version backend / spec pas encore à jour).
      if (created.buildingId === payload.buildingId) {
        return { created, localUri: payload.uri };
      }
      const attached = await attachPhoto(created.id, {
        buildingId: payload.buildingId,
      });
      return { created: attached, localUri: payload.uri };
    },
    onMutate: async (payload) => {
      const placeholder = buildPlaceholder(missionId, payload);

      const candidateKeys = [
        photosKeys.mission(missionId),
        ...(payload.zoneId ? [photosKeys.zone(payload.zoneId)] : []),
        ...(payload.buildingId
          ? [photosKeys.building(payload.buildingId)]
          : []),
      ];

      const snapshots: {
        key: readonly unknown[];
        previous: Photo[] | undefined;
      }[] = [];

      await Promise.all(
        candidateKeys.map(async (key) => {
          await queryClient.cancelQueries({ queryKey: key });
          const previous = queryClient.getQueryData<Photo[]>(key);
          if (previous) {
            queryClient.setQueryData<Photo[]>(key, [placeholder, ...previous]);
          }
          snapshots.push({ key, previous });
        }),
      );

      return { snapshots };
    },
    onError: (_err, _payload, context) => {
      context?.snapshots.forEach(({ key, previous }) => {
        queryClient.setQueryData(key, previous);
      });
    },
    onSuccess: ({ created }, payload, context) => {
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
      queryClient.invalidateQueries({ queryKey: photosKeys.all });
      void updated;
    },
  });
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      photoId,
      payload,
    }: {
      photoId: string;
      payload: UpdatePhotoPayload;
    }) => updatePhoto(photoId, payload),
    onMutate: async ({ photoId, payload }) => {
      const snapshots = queryClient.getQueriesData<Photo[]>({
        queryKey: photosKeys.all,
      });

      await queryClient.cancelQueries({ queryKey: photosKeys.all });

      queryClient.setQueriesData<Photo[]>(
        { queryKey: photosKeys.all },
        (prev) =>
          prev?.some((p) => p.id === photoId)
            ? prev.map((p) =>
                p.id === photoId
                  ? { ...p, caption: payload.caption ?? null }
                  : p,
              )
            : prev,
      );

      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, previous]) => {
        queryClient.setQueryData(key, previous);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: photosKeys.all });
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
