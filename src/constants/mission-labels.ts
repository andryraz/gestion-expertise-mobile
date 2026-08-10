import { MissionStatus, MissionType } from "@/types/mission";

export const STATUS_LABELS: Record<MissionStatus, string> = {
  BROUILLON: "Brouillon",
  PRISE_DE_CONTACT: "Prise de contact",
  DEVIS_EN_PREPARATION: "Devis en préparation",
  DEVIS_ENVOYE: "Devis envoyé",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ENVOYEE: "Envoyée",
};

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  PATHOLOGIE: "Pathologie",
  EVALUATION_TERRAIN: "Évaluation terrain",
  EVALUATION_BATIMENT: "Évaluation bâtiment",
  CONFORMITE_TRAVAUX: "Conformité travaux",
  LITIGE_TRAVAUX: "Litige travaux",
  AUTRE: "Autre",
};

export type StatusTone = "muted" | "accent" | "success" | "danger";

export const STATUS_TRANSITIONS: Partial<
  Record<MissionStatus, MissionStatus[]>
> = {
  BROUILLON: ["PRISE_DE_CONTACT"],
  PRISE_DE_CONTACT: ["DEVIS_EN_PREPARATION"],
  DEVIS_EN_PREPARATION: ["DEVIS_ENVOYE"],
  DEVIS_ENVOYE: ["ACCEPTEE", "REFUSEE"],
  ACCEPTEE: ["EN_COURS"],
  REFUSEE: ["EN_COURS"],
  EN_COURS: ["TERMINEE"],
  TERMINEE: ["ENVOYEE"],
  ENVOYEE: [],
};

export const STATUS_TONE: Record<MissionStatus, StatusTone> = {
  BROUILLON: "muted",
  PRISE_DE_CONTACT: "accent",
  DEVIS_EN_PREPARATION: "accent",
  DEVIS_ENVOYE: "accent",
  ACCEPTEE: "accent",
  EN_COURS: "accent",
  REFUSEE: "danger",
  TERMINEE: "success",
  ENVOYEE: "success",
};
