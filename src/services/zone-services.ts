import { apiRequest } from "@/services/api-client";
import type {
  CreateZonePayload,
  UpdateZonePayload,
  Zone,
  ZoneTreeNode,
} from "@/types/zone";

export function getBuildingZonesTree(buildingId: string) {
  return apiRequest<ZoneTreeNode[]>(`/buildings/${buildingId}/zones/tree`, {
    auth: true,
  });
}

export function createZone(
  buildingId: string,
  payload: CreateZonePayload,
) {
  return apiRequest<Zone>(`/buildings/${buildingId}/zones`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function updateZone(zoneId: string, payload: UpdateZonePayload) {
  return apiRequest<Zone>(`/zones/${zoneId}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteZone(zoneId: string) {
  return apiRequest<void>(`/zones/${zoneId}`, {
    method: "DELETE",
    auth: true,
  });
}