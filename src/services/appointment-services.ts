import { apiRequest } from "@/services/api-client";
import { Appointment } from "@/types/appointment";

// GET /appointments : vue calendrier, filtrée par plage de dates (bornes incluses).
// Pas de filtrage par expert côté backend pour cet endpoint — un compte EXPERT
// n'a de toute façon des rendez-vous que sur ses propres missions.
export function getAppointments(from: string, to: string) {
  const query = new URLSearchParams({ from, to }).toString();
  return apiRequest<Appointment[]>(`/appointments?${query}`, { auth: true });
}
