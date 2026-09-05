import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createParty,
  deleteParty,
  getMissionParties,
  updateParty,
} from "@/services/party-services";
import type {
  CreatePartyPayload,
  Party,
  UpdatePartyPayload,
} from "@/types/party";

export const partiesKeys = {
  mission: (missionId: string) => ["parties", missionId] as const,
};

export function useMissionParties(missionId: string) {
  return useQuery({
    queryKey: partiesKeys.mission(missionId),
    queryFn: () => getMissionParties(missionId),
    enabled: !!missionId,
  });
}

export function useCreateParty(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePartyPayload) =>
      createParty(missionId, payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Party[]>(
        partiesKeys.mission(missionId),
        (old) => (old ? [...old, created] : [created]),
      );
    },
  });
}

export function useUpdateParty(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partyId,
      payload,
    }: {
      partyId: string;
      payload: UpdatePartyPayload;
    }) => updateParty(partyId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<Party[]>(partiesKeys.mission(missionId), (old) =>
        old?.map((p) => (p.id === updated.id ? updated : p)),
      );
    },
  });
}

export function useDeleteParty(missionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (partyId: string) => deleteParty(partyId),
    onSuccess: (_result, partyId) => {
      queryClient.setQueryData<Party[]>(partiesKeys.mission(missionId), (old) =>
        old?.filter((p) => p.id !== partyId),
      );
    },
  });
}
