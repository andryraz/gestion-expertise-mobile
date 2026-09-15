import { apiRequest } from "@/services/api-client";
import type {
    CreateMeasurementPayload,
    Measurement,
    UpdateMeasurementPayload,
} from "@/types/measurement";

export function getMissionMeasurements(missionId: string) {
  return apiRequest<Measurement[]>(`/missions/${missionId}/measurements`, {
    auth: true,
  });
}

export function getBuildingMeasurements(buildingId: string) {
  return apiRequest<Measurement[]>(`/buildings/${buildingId}/measurements`, {
    auth: true,
  });
}

export function getZoneMeasurements(zoneId: string) {
  return apiRequest<Measurement[]>(`/zones/${zoneId}/measurements`, {
    auth: true,
  });
}

export async function getMeasurementTypes(
  missionId: string,
): Promise<string[]> {
  const data = await apiRequest<{ types?: string[] }>(
    `/missions/${missionId}/measurements/types`,
    { auth: true },
  );

  return data.types ?? [];
}

export function createMeasurement(
  missionId: string,
  payload: CreateMeasurementPayload,
) {
  return apiRequest<Measurement>(`/missions/${missionId}/measurements`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function updateMeasurement(
  measurementId: string,
  payload: UpdateMeasurementPayload,
) {
  return apiRequest<Measurement>(`/measurements/${measurementId}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteMeasurement(measurementId: string) {
  return apiRequest<void>(`/measurements/${measurementId}`, {
    method: "DELETE",
    auth: true,
  });
}
