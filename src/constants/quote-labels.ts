import type { QuoteStatus } from "@/types/quote";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  REMPLACE: "Remplacé",
};

export const QUOTE_STATUS_BG: Record<QuoteStatus, string> = {
  BROUILLON: "bg-background-selected dark:bg-background-selected-dark",
  ENVOYE: "bg-background-selected dark:bg-background-selected-dark",
  ACCEPTE: "bg-success dark:bg-success-dark",
  REFUSE: "bg-danger dark:bg-danger-dark",
  REMPLACE: "bg-background-selected dark:bg-background-selected-dark",
};

export const QUOTE_STATUS_FG: Record<QuoteStatus, string> = {
  BROUILLON: "text-secondary",
  ENVOYE: "text-secondary",
  ACCEPTE: "text-background dark:text-background-dark",
  REFUSE: "text-background dark:text-background-dark",
  REMPLACE: "text-secondary",
};

export const DEFAULT_CURRENCY = "MGA";

export function formatAmount(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("fr-FR");
  return `${formatted} ${currency}`;
}
