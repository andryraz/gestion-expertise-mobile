import { API_URL } from "@/constants/api";
import { getToken } from "@/services/token-storage";
import { logger } from "@/utils/logger";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const REQUEST_TIMEOUT_MS = 15000;

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const method = options.method ?? "GET";
  // Never log request bodies for auth endpoints (they contain credentials)
  const loggableBody = path.startsWith("/auth") ? undefined : options.body;
  logger.debug("API", `→ ${method} ${path}`, loggableBody);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.error(
        "API",
        `← Timeout (${REQUEST_TIMEOUT_MS}ms) ${method} ${path}`,
      );
      throw new ApiError(
        0,
        "Le serveur met trop de temps à répondre. Vérifie ta connexion et réessaie.",
      );
    }
    logger.error(
      "API",
      `← Échec réseau ${method} ${path}`,
      err instanceof Error ? err.message : err,
    );
    throw new ApiError(
      0,
      "Impossible de joindre le serveur. Vérifie ta connexion.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message;
    logger.error("API", `← ${response.status} ${method} ${path}`, message);

    if (response.status === 401 && options.auth) {
      logger.warn(
        "API",
        "Session expirée ou invalide (401) — déconnexion automatique",
      );
      unauthorizedHandler?.();
    }

    throw new ApiError(response.status, message ?? "Une erreur est survenue");
  }

  logger.debug("API", `← ${response.status} ${method} ${path}`, "OK");
  return data as T;
}
