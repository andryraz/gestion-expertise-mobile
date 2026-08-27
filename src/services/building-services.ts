import { apiRequest } from "@/services/api-client";
import type {
    Building,
    CreateBuildingPayload,
    UpdateBuildingPayload,
} from "@/types/building";

export function getMissionBuildings(missionId: string) {
  return apiRequest<Building[]>(`/missions/${missionId}/buildings`, {
    auth: true,
  });
}

export function createBuilding(
  missionId: string,
  payload: CreateBuildingPayload,
) {
  return apiRequest<Building>(`/missions/${missionId}/buildings`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function getBuilding(id: string) {
  return apiRequest<Building>(`/buildings/${id}`, { auth: true });
}

export function updateBuilding(id: string, payload: UpdateBuildingPayload) {
  return apiRequest<Building>(`/buildings/${id}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteBuilding(id: string) {
  return apiRequest<void>(`/buildings/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
