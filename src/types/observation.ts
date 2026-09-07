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
    zoneType: string;
  } | null;
  disorderType?: {
    id: string;
    name: string;
    category: string;
  } | null;
};

export type CreateObservationPayload = {
  disorderTypeId: string;
  description: string;
  severity: ObservationSeverity;
  probableCause?: string;
};
