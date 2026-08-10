import { STATUS_LABELS } from "@/constants/mission-labels";
import { apiRequest } from "@/services/api-client";
import {
  CreateMissionPayload,
  Mission,
  MissionsStats,
  MissionStatus,
  PaginatedMissions,
  UpdateMissionPayload,
} from "@/types/mission";
import { logger } from "@/utils/logger";

type ScopeParams = {
  // Passed for EXPERT users so the backend only returns their own missions.
  // ADMIN users omit this to see every mission.
  expertId?: string;
};

export function getMissionsStats() {
  return apiRequest<MissionsStats>("/missions/stats", { auth: true });
}

export function computeMissionsStats(
  activeMissions: Mission[],
  archivedCount: number,
): MissionsStats {
  const byStatus = (Object.keys(STATUS_LABELS) as MissionStatus[])
    .map((status) => ({
      status,
      count: activeMissions.filter((m) => m.status === status).length,
    }))
    .filter((entry) => entry.count > 0);

  const pending = activeMissions
    .filter((m) => m.status === "DEVIS_ENVOYE")
    .map(({ id, reference, title }) => ({ id, reference, title }));

  return {
    total: activeMissions.length + archivedCount,
    byStatus,
    pendingClientResponse: { count: pending.length, missions: pending },
    overdue: { count: 0, missions: [] },
    archived: { count: archivedCount },
  };
}

type GetMissionsParams = ScopeParams & {
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
  const result = await apiRequest<PaginatedMissions>(
    `/missions${qs ? `?${qs}` : ""}`,
    { auth: true },
  );

  // Defensive check: if we asked to be scoped to one expert but the backend
  // still returned missions belonging to someone else, warn loudly instead
  // of silently displaying (or silently hiding, which would corrupt
  // pagination totals) the wrong data. Fix belongs server-side.
  if (params.expertId) {
    const leaked = result.data.filter((m) => m.expertId !== params.expertId);
    if (leaked.length > 0) {
      logger.warn(
        "Missions",
        "Le backend a renvoyé des missions n'appartenant pas à l'expert demandé — la restriction doit être appliquée côté serveur",
        { expertId: params.expertId, leakedIds: leaked.map((m) => m.id) },
      );
    }
  }

  return result;
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
