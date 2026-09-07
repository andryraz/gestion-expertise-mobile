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
