export type PartyRole =
  | "CLIENT"
  | "AVOCAT"
  | "ENTREPRISE"
  | "EXPERT"
  | "AUTRE";

export type Party = {
  id: string;
  missionId: string;
  name: string;
  role: PartyRole;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  CLIENT: "Client",
  AVOCAT: "Avocat",
  ENTREPRISE: "Entreprise",
  EXPERT: "Expert",
  AUTRE: "Autre",
};
