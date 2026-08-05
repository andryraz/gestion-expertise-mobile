import { apiRequest } from "@/services/api-client";
import {
  MissionsStats,
  MissionStatus,
  PaginatedMissions,
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

export function getMissions(params: GetMissionsParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value));
  });
  const qs = query.toString();
  return apiRequest<PaginatedMissions>(`/missions${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
}
