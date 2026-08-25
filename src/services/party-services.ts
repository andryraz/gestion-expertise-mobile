import { apiRequest } from "@/services/api-client";
import type { CreatePartyPayload, Party, UpdatePartyPayload } from "@/types/party";

export function getMissionParties(missionId: string) {
  return apiRequest<Party[]>(
    `/missions/${missionId}/parties`,
    { auth: true },
  );
}

export function createParty(missionId: string, payload: CreatePartyPayload) {
  return apiRequest<Party>(
    `/missions/${missionId}/parties`,
    {
      method: "POST",
      body: payload,
      auth: true,
    },
  );
}

export function updateParty(id: string, payload: UpdatePartyPayload) {
  return apiRequest<Party>(
    `/parties/${id}`,
    {
      method: "PATCH",
      body: payload,
      auth: true,
    },
  );
}

export function deleteParty(id: string) {
  return apiRequest<void>(
    `/parties/${id}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}
