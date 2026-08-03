import { MissionStatus } from "@/types/mission";

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
