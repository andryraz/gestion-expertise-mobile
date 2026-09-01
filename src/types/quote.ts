export type QuoteStatus =
  | "BROUILLON"
  | "ENVOYE"
  | "ACCEPTE"
  | "REFUSE"
  | "REMPLACE";

export type Quote = {
  id: string;
  missionId: string;
  version: number;
  amount: number;
  currency: string;
  description?: string | null;
  documentPath?: string | null;
  documentFileName?: string | null;
  documentMimeType?: string | null;
  status: QuoteStatus;
  createdAt: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
};

export type CreateQuotePayload = {
  amount: number;
  currency?: string;
  description?: string;
  document?: {
    uri: string;
    name: string;
    mimeType: string;
  };
};

export type UpdateQuotePayload = {
  amount?: number;
  currency?: string;
  description?: string;
};

export type MarkQuoteSentPayload = {
  recipientEmail?: string;
};
