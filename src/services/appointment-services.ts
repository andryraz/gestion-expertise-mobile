import { apiRequest } from "@/services/api-client";
import { Appointment } from "@/types/appointment";

export function getAppointments(from: string, to: string) {
  const query = new URLSearchParams({ from, to }).toString();
  return apiRequest<Appointment[]>(`/appointments?${query}`, { auth: true });
}
