import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAppointment,
  getAppointment,
  getAppointments,
  getMissionAppointments,
  updateAppointment,
} from "@/services/appointment-services";
import { scheduleAppointmentReminder } from "@/services/notification-services";
import type {
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from "@/types/appointment";

export const appointmentsKeys = {
  all: ["appointments"] as const,
  range: (from: string, to: string) =>
    [...appointmentsKeys.all, "range", from, to] as const,
  mission: (missionId: string) =>
    [...appointmentsKeys.all, "mission", missionId] as const,
  detail: (id: string) => [...appointmentsKeys.all, "detail", id] as const,
};

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentsKeys.detail(id),
    queryFn: () => getAppointment(id),
    enabled: !!id,
  });
}

// calendar.tsx : rendez-vous du mois visible
export function useAppointmentsRange(from: string, to: string) {
  return useQuery({
    queryKey: appointmentsKeys.range(from, to),
    queryFn: () => getAppointments(from, to),
  });
}

// mission-appointment-tab.tsx : rendez-vous d'une mission donnée
export function useMissionAppointments(missionId: string) {
  return useQuery({
    queryKey: appointmentsKeys.mission(missionId),
    queryFn: () => getMissionAppointments(missionId),
    enabled: !!missionId,
  });
}

// Toute mutation de RDV peut affecter à la fois la vue calendrier (plage
// de dates) et l'onglet RDV d'une mission : on invalide tout ["appointments"]
// plutôt que d'essayer de cibler la bonne plage de dates.
function useInvalidateAppointments() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
}

export function useCreateAppointment(missionId: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      createAppointment(missionId, payload),
    onSuccess: async (created) => {
      await scheduleAppointmentReminder(created);
      invalidate();
    },
  });
}

export function useUpdateAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: ({
      appointmentId,
      payload,
    }: {
      appointmentId: string;
      payload: UpdateAppointmentPayload;
    }) => updateAppointment(appointmentId, payload),
    onSuccess: async (updated) => {
      await scheduleAppointmentReminder(updated);
      invalidate();
    },
  });
}
