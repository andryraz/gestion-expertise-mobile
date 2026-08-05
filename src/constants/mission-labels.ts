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
