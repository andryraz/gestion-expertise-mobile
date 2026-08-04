import { apiRequest } from "@/services/api-client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "EXPERT" | "ADMIN";
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = { accessToken: string; user: User };

export function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function loginRequest(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function getProfileRequest() {
  return apiRequest<User>("/auth/profile", { auth: true });
}

export function logoutRequest() {
  return apiRequest<void>("/auth/logout", { method: "POST", auth: true });
}
