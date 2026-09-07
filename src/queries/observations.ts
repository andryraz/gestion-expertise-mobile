import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createObservation,
  getMissionObservations,
  getObservation,
  getZoneObservations,
} from "@/services/observation-services";
import type { CreateObservationPayload } from "@/types/observation";

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
