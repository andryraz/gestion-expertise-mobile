import type { MeasurementUnit } from "@/types/measurement";

export const MEASUREMENT_UNITS: MeasurementUnit[] = [
  "MM",
  "CM",
  "M",
  "M2",
  "M3",
  "PERCENT",
  "AUTRE",
];

export const MEASUREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  MM: "mm",
  CM: "cm",
  M: "m",
  M2: "m²",
  M3: "m³",
  PERCENT: "%",
  AUTRE: "autre",
};
