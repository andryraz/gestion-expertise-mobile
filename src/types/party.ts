export type PartyRole =
  | "CLIENT"
  | "REQUERANT"
  | "AVOCAT"
  | "ENTREPRISE"
  | "PROPRIETAIRE"
  | "AUTRE";

export type Party = {
  id: string;
  missionId: string;
  fullName: string;
  role: PartyRole;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  CLIENT: "Client",
  REQUERANT: "Requérant",
  AVOCAT: "Avocat",
  ENTREPRISE: "Entreprise",
  PROPRIETAIRE: "Propriétaire",
  AUTRE: "Autre",
};

export type CreatePartyPayload = {
  fullName: string;
  role: PartyRole;
  email?: string;
  phone?: string;
};

export type UpdatePartyPayload = {
  fullName?: string;
  role?: PartyRole;
  email?: string;
  phone?: string;
};
