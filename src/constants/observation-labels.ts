import type { DisorderTypeCategory } from "@/types/disorder-type";
import type { ObservationSeverity } from "@/types/observation";

export const OBSERVATION_SEVERITY_LABELS: Record<ObservationSeverity, string> =
  {
    MINEUR: "Mineur",
    MODERE: "Modéré",
    URGENT: "Urgent",
  };

export const OBSERVATION_SEVERITY_TONE: Record<
  ObservationSeverity,
  "muted" | "accent" | "danger"
> = {
  MINEUR: "muted",
  MODERE: "accent",
  URGENT: "danger",
};

/** Couleurs de fond des pastilles de sévérité (nativewind). */
export const OBSERVATION_SEVERITY_BG: Record<ObservationSeverity, string> = {
  MINEUR: "bg-background-selected dark:bg-background-selected-dark",
  MODERE: "bg-accent",
  URGENT: "bg-danger dark:bg-danger-dark",
};

/** Couleur du texte des pastilles de sévérité (themeColor de ThemedText). */
export const OBSERVATION_SEVERITY_TEXT_COLOR: Record<
  ObservationSeverity,
  "textSecondary" | "background"
> = {
  MINEUR: "textSecondary",
  MODERE: "background",
  URGENT: "background",
};

export const DISORDER_CATEGORY_LABELS: Record<DisorderTypeCategory, string> = {
  STRUCTUREL: "Structurel",
  HUMIDITE: "Humidité",
  INTEMPERIES: "Intempéries",
  CORROSION: "Corrosion",
  AUTRE: "Autre",
};
