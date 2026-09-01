import { File, UploadType } from "expo-file-system";

import { API_URL } from "@/constants/api";
import {
  ApiError,
  apiMultipartRequest,
  apiRequest,
} from "@/services/api-client";
import { getToken } from "@/services/token-storage";
import type {
  CreateQuotePayload,
  MarkQuoteSentPayload,
  Quote,
  UpdateQuotePayload,
} from "@/types/quote";
import { logger } from "@/utils/logger";

export function getMissionQuotes(missionId: string) {
  return apiRequest<Quote[]>(`/missions/${missionId}/quotes`, { auth: true });
}

export function getLatestQuote(missionId: string) {
  return apiRequest<Quote>(`/missions/${missionId}/quotes/latest`, {
    auth: true,
  });
}

export async function createQuote(
  missionId: string,
  payload: CreateQuotePayload,
) {
  if (payload.document) {
    return createQuoteWithDocument(missionId, payload);
  }

  const formData = new FormData();
  formData.append("amount", String(payload.amount));
  if (payload.currency) formData.append("currency", payload.currency);
  if (payload.description) formData.append("description", payload.description);
  return apiMultipartRequest<Quote>(`/missions/${missionId}/quotes`, formData, {
    method: "POST",
    auth: true,
  });
}

async function createQuoteWithDocument(
  missionId: string,
  payload: CreateQuotePayload,
): Promise<Quote> {
  const { uri, mimeType } = payload.document!;

  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  logger.debug("API", `→ POST /missions/${missionId}/quotes (native upload)`);

  const file = new File(uri);

  let result: { status: number; body: string; headers: Record<string, string> };
  try {
    result = await file.upload(`${API_URL}/missions/${missionId}/quotes`, {
      fieldName: "document",
      httpMethod: "POST",
      mimeType,
      headers,
      uploadType: UploadType.MULTIPART,
      parameters: {
        amount: String(payload.amount),
        ...(payload.currency ? { currency: payload.currency } : {}),
        ...(payload.description ? { description: payload.description } : {}),
      },
    });
  } catch (err) {
    logger.error(
      "API",
      `← Échec upload natif ${missionId}`,
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    );
    throw new ApiError(
      0,
      "Impossible de joindre le serveur. Vérifie ta connexion.",
    );
  }

  const data = result.body ? JSON.parse(result.body) : null;

  if (result.status < 200 || result.status >= 300) {
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message;
    logger.error(
      "API",
      `← ${result.status} POST /missions/${missionId}/quotes (native upload)`,
      message,
    );
    throw new ApiError(result.status, message ?? "Une erreur est survenue");
  }

  logger.debug(
    "API",
    `← ${result.status} POST /missions/${missionId}/quotes (native upload)`,
    "OK",
  );
  return data as Quote;
}

export function updateQuote(quoteId: string, payload: UpdateQuotePayload) {
  return apiRequest<Quote>(`/quotes/${quoteId}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteQuote(quoteId: string) {
  return apiRequest<void>(`/quotes/${quoteId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function acceptQuote(quoteId: string) {
  return apiRequest<Quote>(`/quotes/${quoteId}/accept`, {
    method: "PATCH",
    auth: true,
  });
}

export function refuseQuote(quoteId: string) {
  return apiRequest<Quote>(`/quotes/${quoteId}/refuse`, {
    method: "PATCH",
    auth: true,
  });
}

export function markQuoteSent(quoteId: string, payload?: MarkQuoteSentPayload) {
  return apiRequest<Quote>(`/quotes/${quoteId}/mark-sent`, {
    method: "PATCH",
    body: payload ?? {},
    auth: true,
  });
}

export async function getDocumentDownloadUrl(quoteId: string): Promise<string> {
  const token = await getToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_URL}/quotes/${quoteId}/document${query}`;
}
