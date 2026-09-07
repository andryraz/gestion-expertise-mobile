import { apiRequest } from "@/services/api-client";
import type {
  CreateObservationPayload,
  Observation,
  ObservationDetail,
  ObservationSeverity,
} from "@/types/observation";

export function getZoneObservations(
  zoneId: string,
  severity?: ObservationSeverity,
) {
  const query = severity ? `?severity=${severity}` : "";
  return apiRequest<Observation[]>(`/zones/${zoneId}/observations${query}`, {
    auth: true,
  });
}

export function getMissionObservations(
  missionId: string,
  severity?: ObservationSeverity,
) {
  const query = severity ? `?severity=${severity}` : "";
  return apiRequest<Observation[]>(
    `/missions/${missionId}/observations${query}`,
    { auth: true },
  );
}

export function getObservation(id: string) {
  return apiRequest<ObservationDetail>(`/observations/${id}`, { auth: true });
}

export function createObservation(
  zoneId: string,
  payload: CreateObservationPayload,
) {
  return apiRequest<Observation>(`/zones/${zoneId}/observations`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}
