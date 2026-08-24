import { apiRequest } from "@/services/api-client";
import { Appointment } from "@/types/appointment";

export function getAppointments(from: string, to: string) {
  const query = new URLSearchParams({ from, to }).toString();
  return apiRequest<Appointment[]>(`/appointments?${query}`, { auth: true });
}

export function getMissionAppointments(missionId: string) {
  return apiRequest<Appointment[]>(
    `/missions/${missionId}/appointments`,
    { auth: true },
  );
}
