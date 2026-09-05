import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  archiveMission,
  createMission,
  getMission,
  getMissions,
  getMissionsStats,
  unarchiveMission,
  updateMission,
  updateMissionStatus,
} from "@/services/mission-services";
import type {
  CreateMissionPayload,
  Mission,
  MissionStatus,
  UpdateMissionPayload,
} from "@/types/mission";

const PAGE_SIZE = 20;

export const missionsKeys = {
  all: ["missions"] as const,
  dashboard: () => [...missionsKeys.all, "dashboard"] as const,
  list: (filters: { search?: string; status?: string }) =>
    [...missionsKeys.all, "list", filters] as const,
  detail: (id: string) => [...missionsKeys.all, "detail", id] as const,
};

export function useDashboardMissions() {
  return useQuery({
    queryKey: missionsKeys.dashboard(),
    queryFn: async () => {
      const [stats, missions] = await Promise.all([
        getMissionsStats(),
        getMissions({
          archived: false,
          sortBy: "updatedAt",
          sortOrder: "desc",
          limit: 5,
        }),
      ]);
      return { stats, missions: missions.data };
    },
  });
}

export function useMissionsList(filters: { search?: string; status?: string }) {
  return useInfiniteQuery({
    queryKey: missionsKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getMissions({
        search: filters.search || undefined,
        status:
          !filters.status || filters.status === "ALL"
            ? undefined
            : (filters.status as MissionStatus),
        archived: false,
        sortBy: "updatedAt",
        sortOrder: "desc",
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });
}

export function useMissionDetail(id: string) {
  return useQuery({
    queryKey: missionsKeys.detail(id),
    queryFn: () => getMission(id),
    enabled: !!id,
  });
}

function useInvalidateMissionLists() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: missionsKeys.dashboard() });
    queryClient.invalidateQueries({
      queryKey: [...missionsKeys.all, "list"],
    });
  };
}

export function useCreateMission() {
  const invalidateLists = useInvalidateMissionLists();
  return useMutation({
    mutationFn: (payload: CreateMissionPayload) => createMission(payload),
    onSuccess: invalidateLists,
  });
}

function useApplyMissionUpdate(id: string) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateMissionLists();
  return (updated: Mission) => {
    queryClient.setQueryData(missionsKeys.detail(id), updated);
    invalidateLists();
  };
}

export function useUpdateMission(id: string) {
  const applyUpdate = useApplyMissionUpdate(id);
  return useMutation({
    mutationFn: (payload: UpdateMissionPayload) => updateMission(id, payload),
    onSuccess: applyUpdate,
  });
}

export function useUpdateMissionStatus(id: string) {
  const applyUpdate = useApplyMissionUpdate(id);
  return useMutation({
    mutationFn: (status: MissionStatus) => updateMissionStatus(id, status),
    onSuccess: applyUpdate,
  });
}

export function useToggleMissionArchive(id: string) {
  const applyUpdate = useApplyMissionUpdate(id);
  return useMutation({
    mutationFn: (isArchived: boolean) =>
      isArchived ? unarchiveMission(id) : archiveMission(id),
    onSuccess: applyUpdate,
  });
}

export function useRefreshMissionAfterExternalChange(id: string) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateMissionLists();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: missionsKeys.detail(id) });
    invalidateLists();
  };
}
