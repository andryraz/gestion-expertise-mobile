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

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  PLANIFIE: "muted",
  CONFIRME: "accent",
  REALISE: "success",
  REPORTE: "muted",
  ANNULE: "danger",
};

export const APPOINTMENT_STATUS_BG: Record<AppointmentStatus, string> = {
  PLANIFIE: "bg-[#3B82F6]",
  CONFIRME: "bg-[#8B5CF6]",
  REALISE: "bg-success dark:bg-success-dark",
  ANNULE: "bg-background-selected dark:bg-background-selected-dark",
  REPORTE: "bg-[#F97316]",
};

export const APPOINTMENT_STATUS_FG: Record<AppointmentStatus, string> = {
  PLANIFIE: "text-white",
  CONFIRME: "text-white",
  REALISE: "text-white",
  ANNULE: "text-secondary dark:text-text-secondary-dark",
  REPORTE: "text-white",
};
