export type MeasurementUnit =
  | "MM"
  | "CM"
  | "M"
  | "M2"
  | "M3"
  | "PERCENT"
  | "AUTRE";

export type Measurement = {
  id: string;
  missionId: string;
  buildingId: string | null;
  zoneId: string | null;
  measureType: string;
  value: number;
  unit: MeasurementUnit;
  label: string | null;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMeasurementPayload = {
  measureType: string;
  value: number;
  unit: MeasurementUnit;
  label?: string;
  measuredAt: string;
  buildingId?: string;
  zoneId?: string;
};

export type UpdateMeasurementPayload = {
  measureType?: string;
  value?: number;
  unit?: MeasurementUnit;
  label?: string;
};
