import { StatusTone } from "@/constants/mission-labels";
import { AppointmentStatus, AppointmentType } from "@/types/appointment";

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  APPEL: "Appel",
  VISITE_RECONNAISSANCE: "Visite de reconnaissance",
  RENDEZ_VOUS_SITE: "Rendez-vous sur site",
  AUTRE: "Autre",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PLANIFIE: "Planifié",
  CONFIRME: "Confirmé",
  REALISE: "Réalisé",
  ANNULE: "Annulé",
  REPORTE: "Reporté",
};

// Même palette de tons (muted / accent / success / danger) que STATUS_TONE
// pour les missions, afin de rester cohérent avec le design existant.
export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  PLANIFIE: "muted",
  CONFIRME: "accent",
  REALISE: "success",
  REPORTE: "muted",
  ANNULE: "danger",
};
