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

export const STATUS_ORDER: MissionStatus[] = [
  "BROUILLON",
  "PRISE_DE_CONTACT",
  "DEVIS_EN_PREPARATION",
  "DEVIS_ENVOYE",
  "ACCEPTEE",
  "REFUSEE",
  "EN_COURS",
  "TERMINEE",
  "ENVOYEE",
];

export const STATUS_INDEX: Record<MissionStatus, number> = {
  BROUILLON: 0,
  PRISE_DE_CONTACT: 1,
  DEVIS_EN_PREPARATION: 2,
  DEVIS_ENVOYE: 3,
  ACCEPTEE: 4,
  REFUSEE: 5,
  EN_COURS: 6,
  TERMINEE: 7,
  ENVOYEE: 8,
};

export const STATUS_ACTION_LABEL: Record<MissionStatus, string> = {
  BROUILLON: "Confirmer la prise de contact",
  PRISE_DE_CONTACT: "Préparer un devis",
  DEVIS_EN_PREPARATION: "Envoyer le devis",
  DEVIS_ENVOYE: "Voir le devis",
  ACCEPTEE: "Commencer la mission",
  REFUSEE: "Voir le devis",
  EN_COURS: "Terminer la mission",
  TERMINEE: "Envoyer le rapport",
  ENVOYEE: "Mission terminée",
};

export const STATUS_ADVANCE: Partial<Record<MissionStatus, MissionStatus>> = {
  BROUILLON: "PRISE_DE_CONTACT",
  PRISE_DE_CONTACT: "DEVIS_EN_PREPARATION",
  DEVIS_EN_PREPARATION: "DEVIS_ENVOYE",
  DEVIS_ENVOYE: "ACCEPTEE",
  ACCEPTEE: "EN_COURS",
  EN_COURS: "TERMINEE",
  TERMINEE: "ENVOYEE",
  ENVOYEE: "ENVOYEE",
};
