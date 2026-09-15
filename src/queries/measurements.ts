import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createMeasurement,
    deleteMeasurement,
    getBuildingMeasurements,
    getMeasurementTypes,
    getMissionMeasurements,
    getZoneMeasurements,
    updateMeasurement,
} from "@/services/measurement-services";
import type {
    CreateMeasurementPayload,
    UpdateMeasurementPayload,
} from "@/types/measurement";

export const measurementsKeys = {
  all: ["measurements"] as const,
  mission: (missionId: string) =>
    [...measurementsKeys.all, "mission", missionId] as const,
  building: (buildingId: string) =>
    [...measurementsKeys.all, "building", buildingId] as const,
  zone: (zoneId: string) => [...measurementsKeys.all, "zone", zoneId] as const,
  types: (missionId: string) =>
    [...measurementsKeys.all, "types", missionId] as const,
};

export function useMissionMeasurements(missionId: string) {
  return useQuery({
    queryKey: measurementsKeys.mission(missionId),
    queryFn: () => getMissionMeasurements(missionId),
    enabled: !!missionId,
  });
}

export function useBuildingMeasurements(buildingId: string) {
  return useQuery({
    queryKey: measurementsKeys.building(buildingId),
    queryFn: () => getBuildingMeasurements(buildingId),
    enabled: !!buildingId,
  });
}

export function useZoneMeasurements(zoneId: string) {
  return useQuery({
    queryKey: measurementsKeys.zone(zoneId),
    queryFn: () => getZoneMeasurements(zoneId),
    enabled: !!zoneId,
  });
}

export function useMeasurementTypes(missionId: string) {
  return useQuery({
    queryKey: measurementsKeys.types(missionId),
    queryFn: () => getMeasurementTypes(missionId),
    enabled: !!missionId,
  });
}

export function useCreateMeasurement(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMeasurementPayload) =>
      createMeasurement(missionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: measurementsKeys.all });
    },
  });
}

export function useUpdateMeasurement(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      payload,
    }: {
      measurementId: string;
      payload: UpdateMeasurementPayload;
    }) => updateMeasurement(measurementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: measurementsKeys.all });
    },
  });
}

export function useDeleteMeasurement(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (measurementId: string) => deleteMeasurement(measurementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: measurementsKeys.all });
    },
  });
}
