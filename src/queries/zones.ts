import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createZone,
  deleteZone,
  getBuildingZonesTree,
  updateZone,
} from "@/services/zone-services";
import type { CreateZonePayload, UpdateZonePayload } from "@/types/zone";

export const zonesKeys = {
  tree: (buildingId: string) => ["zones", buildingId] as const,
};

export function useZonesTree(buildingId: string) {
  return useQuery({
    queryKey: zonesKeys.tree(buildingId),
    queryFn: () => getBuildingZonesTree(buildingId),
    enabled: !!buildingId,
  });
}

export function useCreateZone(buildingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateZonePayload) => createZone(buildingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesKeys.tree(buildingId) });
    },
  });
}

export function useUpdateZone(buildingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      zoneId,
      payload,
    }: {
      zoneId: string;
      payload: UpdateZonePayload;
    }) => updateZone(zoneId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesKeys.tree(buildingId) });
    },
  });
}

export function useDeleteZone(buildingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) => deleteZone(zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zonesKeys.tree(buildingId) });
    },
  });
}
