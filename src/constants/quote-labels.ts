import type { QuoteProposedBy, QuoteStatus } from "@/types/quote";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  CONTRE_PROPOSITION: "Contre-proposition",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
};

export const QUOTE_STATUS_BG: Record<QuoteStatus, string> = {
  BROUILLON: "bg-background-selected dark:bg-background-selected-dark",
  ENVOYE: "bg-background-selected dark:bg-background-selected-dark",
  CONTRE_PROPOSITION: "bg-accent",
  ACCEPTE: "bg-success dark:bg-success-dark",
  REFUSE: "bg-danger dark:bg-danger-dark",
  EXPIRE: "bg-background-selected dark:bg-background-selected-dark",
};

export const QUOTE_STATUS_FG: Record<QuoteStatus, string> = {
  BROUILLON: "text-secondary",
  ENVOYE: "text-secondary",
  CONTRE_PROPOSITION: "text-background dark:text-background-dark",
  ACCEPTE: "text-background dark:text-background-dark",
  REFUSE: "text-background dark:text-background-dark",
  EXPIRE: "text-secondary",
};

export const QUOTE_PROPOSED_BY_LABELS: Record<QuoteProposedBy, string> = {
  EXPERT: "Expert",
  CLIENT: "Client",
};

export const DEFAULT_CURRENCY = "MGA";

export function formatAmount(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("fr-FR");
  return `${formatted} ${currency}`;
}
