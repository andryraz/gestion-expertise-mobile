import type { DisorderTypeCategory } from "@/types/disorder-type";
import type { ZoneType } from "@/types/zone";

export type ObservationSeverity = "MINEUR" | "MODERE" | "URGENT";

export type Observation = {
  id: string;
  zoneId: string;
  disorderTypeId: string;
  description: string;
  severity: ObservationSeverity;
  probableCause?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ObservationDetail = Observation & {
  zone?: {
    id: string;
    name: string;
    zoneType: ZoneType;
  } | null;
  disorderType?: {
    id: string;
    name: string;
    category: DisorderTypeCategory;
  } | null;
};

export type CreateObservationPayload = {
  disorderTypeId: string;
  description: string;
  severity: ObservationSeverity;
  probableCause?: string;
};

export type UpdateObservationPayload = {
  disorderTypeId?: string;
  description?: string;
  severity?: ObservationSeverity;
  /** Passer null pour effacer la cause probable actuelle. */
  probableCause?: string | null;
};
