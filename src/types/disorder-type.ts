export type DisorderTypeCategory =
  | "STRUCTUREL"
  | "HUMIDITE"
  | "INTEMPERIES"
  | "CORROSION"
  | "AUTRE";

export type DisorderType = {
  id: string;
  name: string;
  category: DisorderTypeCategory;
  description?: string | null;
  createdAt: string;
};

export type CreateDisorderTypePayload = {
  name: string;
  category: DisorderTypeCategory;
  description?: string;
};
