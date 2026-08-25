import { apiRequest } from "@/services/api-client";
import type {
  CreateQuotePayload,
  Quote,
  RespondQuotePayload,
} from "@/types/quote";

export function getMissionQuotes(missionId: string) {
  return apiRequest<Quote[]>(
    `/missions/${missionId}/quotes`,
    { auth: true },
  );
}

export function getLatestQuote(missionId: string) {
  return apiRequest<Quote>(
    `/missions/${missionId}/quotes/latest`,
    { auth: true },
  );
}

export function createQuote(missionId: string, payload: CreateQuotePayload) {
  return apiRequest<Quote>(
    `/missions/${missionId}/quotes`,
    {
      method: "POST",
      body: payload,
      auth: true,
    },
  );
}

export function respondToQuote(
  missionId: string,
  quoteId: string,
  payload: RespondQuotePayload,
) {
  return apiRequest<Quote>(
    `/missions/${missionId}/quotes/${quoteId}/respond`,
    {
      method: "POST",
      body: payload,
      auth: true,
    },
  );
}
