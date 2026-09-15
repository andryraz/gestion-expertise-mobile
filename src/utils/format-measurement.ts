import { MEASUREMENT_UNIT_LABELS } from "@/constants/measurement-labels";
import type { MeasurementUnit } from "@/types/measurement";

/**
 * 12.5 + "M2" -> "12,5 m²" (format FR, 2 décimales max, sans zéro inutile).
 */
export function formatMeasurementValue(
  value: number,
  unit: MeasurementUnit,
): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${MEASUREMENT_UNIT_LABELS[unit]}`;
}
