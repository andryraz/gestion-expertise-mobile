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

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

// export async function apiRequest<T>(
//   path: string,
//   options: RequestOptions = {},
// ): Promise<T> {
//   const headers: Record<string, string> = {
//     "Content-Type": "application/json",
//   };

//   if (options.auth) {
//     const token = await getToken();
//     if (token) headers.Authorization = `Bearer ${token}`;
//   }

//   const response = await fetch(`${API_URL}${path}`, {
//     method: options.method ?? "GET",
//     headers,
//     body: options.body ? JSON.stringify(options.body) : undefined,
//   });

//   const data = await response.json().catch(() => null);

//   if (!response.ok) {
//     const message = Array.isArray(data?.message)
//       ? data.message[0]
//       : data?.message;
//     throw new ApiError(response.status, message ?? "Une erreur est survenue");
//   }

//   return data as T;
// }

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
  logger.debug("API", `→ ${method} ${path}`, options.body);

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : data?.message;
    logger.error("API", `← ${response.status} ${method} ${path}`, message);
    throw new ApiError(response.status, message ?? "Une erreur est survenue");
  }

  logger.debug("API", `← ${response.status} ${method} ${path}`, "OK");
  return data as T;
}
