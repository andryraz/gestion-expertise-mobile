import { apiRequest } from "@/services/api-client";
import { Party } from "@/types/party";

export function getMissionParties(missionId: string) {
  return apiRequest<Party[]>(`/missions/${missionId}/parties`, { auth: true });
}
