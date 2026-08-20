import { apiRequest } from "@/services/api-client";
import {
  CreateMissionPayload,
  Mission,
  MissionsStats,
  MissionStatus,
  PaginatedMissions,
  UpdateMissionPayload,
} from "@/types/mission";

export function getMissionsStats() {
  return apiRequest<MissionsStats>("/missions/stats", { auth: true });
}

type GetMissionsParams = {
  status?: MissionStatus;
  archived?: boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "reference" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export async function getMissions(params: GetMissionsParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value));
  });
  const qs = query.toString();
  return apiRequest<PaginatedMissions>(
    `/missions${qs ? `?${qs}` : ""}`,
    { auth: true },
  );
}

export function getMission(id: string) {
  return apiRequest<Mission>(`/missions/${id}`, { auth: true });
}

export function createMission(payload: CreateMissionPayload) {
  return apiRequest<Mission>("/missions", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function updateMission(id: string, payload: UpdateMissionPayload) {
  return apiRequest<Mission>(`/missions/${id}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function updateMissionStatus(id: string, status: MissionStatus) {
  return apiRequest<Mission>(`/missions/${id}/status`, {
    method: "PATCH",
    body: { status },
    auth: true,
  });
}

export function archiveMission(id: string) {
  return apiRequest<Mission>(`/missions/${id}/archive`, {
    method: "PATCH",
    auth: true,
  });
}

export function unarchiveMission(id: string) {
  return apiRequest<Mission>(`/missions/${id}/unarchive`, {
    method: "PATCH",
    auth: true,
  });
}
