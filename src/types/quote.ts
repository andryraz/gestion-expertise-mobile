export type QuoteStatus =
  | "BROUILLON"
  | "ENVOYE"
  | "CONTRE_PROPOSITION"
  | "ACCEPTE"
  | "REFUSE"
  | "EXPIRE";

export type QuoteProposedBy = "EXPERT" | "CLIENT";

export type Quote = {
  id: string;
  missionId: string;
  version: number;
  amount: number;
  currency: string;
  description?: string | null;
  proposedBy: QuoteProposedBy;
  status: QuoteStatus;
  validUntil?: string | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
};

export type CreateQuotePayload = {
  amount: number;
  currency?: string;
  description?: string;
  proposedBy: QuoteProposedBy;
  status?: QuoteStatus;
};

export type RespondQuoteAction = "ACCEPTE" | "REFUSE" | "CONTRE_PROPOSITION";

export type RespondQuotePayload = {
  action: RespondQuoteAction;
  amount?: number;
  description?: string;
  proposedBy?: QuoteProposedBy;
};
