import { apiRequest } from "@/services/api-client";
import { Appointment } from "@/types/appointment";

// GET /appointments : vue calendrier, filtrée par plage de dates (bornes incluses).
// Le backend ne filtre pas cet endpoint par expert : l'écran calendrier vérifie
// donc côté client que chaque rendez-vous appartient bien à une mission de
// l'utilisateur connecté (via getOwnedMissionIds) et masque le reste.
export function getAppointments(from: string, to: string) {
  const query = new URLSearchParams({ from, to }).toString();
  return apiRequest<Appointment[]>(`/appointments?${query}`, { auth: true });
}
