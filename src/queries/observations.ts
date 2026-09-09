import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createObservation,
  deleteObservation,
  getMissionObservations,
  getObservation,
  getZoneObservations,
  updateObservation,
} from "@/services/observation-services";
import type {
  CreateObservationPayload,
  UpdateObservationPayload,
} from "@/types/observation";

export const observationsKeys = {
  all: ["observations"] as const,
  mission: (missionId: string) =>
    [...observationsKeys.all, "mission", missionId] as const,
  zone: (zoneId: string) => [...observationsKeys.all, "zone", zoneId] as const,
  detail: (id: string) => [...observationsKeys.all, "detail", id] as const,
};

export function useZoneObservations(zoneId: string) {
  return useQuery({
    queryKey: observationsKeys.zone(zoneId),
    queryFn: () => getZoneObservations(zoneId),
    enabled: !!zoneId,
  });
}

export function useMissionObservations(missionId: string) {
  return useQuery({
    queryKey: observationsKeys.mission(missionId),
    queryFn: () => getMissionObservations(missionId),
    enabled: !!missionId,
  });
}

export function useObservation(id: string) {
  return useQuery({
    queryKey: observationsKeys.detail(id),
    queryFn: () => getObservation(id),
    enabled: !!id,
  });
}

export function useCreateObservation(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateObservationPayload) =>
      createObservation(zoneId, payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: observationsKeys.zone(created.zoneId),
      });
      queryClient.invalidateQueries({ queryKey: observationsKeys.all });
    },
  });
}

export function useUpdateObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      observationId,
      payload,
    }: {
      observationId: string;
      payload: UpdateObservationPayload;
    }) => updateObservation(observationId, payload),
    onSuccess: (updated) => {
      // La liste de la zone et toutes les vues observations (mission,
      // détail) doivent refléter les champs modifiés.
      queryClient.invalidateQueries({
        queryKey: observationsKeys.zone(updated.zoneId),
      });
      queryClient.invalidateQueries({ queryKey: observationsKeys.all });
    },
  });
}

export function useDeleteObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (observationId: string) => deleteObservation(observationId),
    onSuccess: () => {
      // Les photos/mesures liées sont détachées côté backend : on
      // resynchronise toutes les listes (zone, mission, détail).
      queryClient.invalidateQueries({ queryKey: observationsKeys.all });
    },
  });
}
