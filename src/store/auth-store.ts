import { create } from "zustand";

import { setUnauthorizedHandler } from "@/services/api-client";
import {
    User,
    getProfileRequest,
    loginRequest,
    logoutRequest,
    registerRequest,
} from "@/services/auth-service";
import { clearToken, getToken, saveToken } from "@/storage/token-storage";
import { logger, maskToken } from "@/utils/logger";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  init: async () => {
    setUnauthorizedHandler(() => {
      logger.info("Auth", "Déconnexion automatique (401)");
      clearToken();
      set({ user: null });
    });

    try {
      const token = await getToken();
      if (!token) {
        logger.debug("Auth", "No token on startup");
        return;
      }
      const profile = await getProfileRequest();
      set({ user: profile });
      logger.info("Auth", "Session restaurée", { userId: profile.id });
    } catch (err) {
      await clearToken();
      logger.warn("Auth", "Session invalide au démarrage, jeton effacé", {
        error: err instanceof Error ? err.message : err,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    logger.info("Auth", "Login attempt", { email });
    try {
      const { accessToken, user } = await loginRequest({ email, password });
      await saveToken(accessToken);
      set({ user });
      logger.info("Auth", "Login successful", {
        userId: user.id,
        token: maskToken(accessToken),
      });
    } catch (err) {
      logger.warn("Auth", "Login failed", {
        email,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  },

  register: async (name, email, password, phone) => {
    logger.info("Auth", "Registration attempt", { email });
    try {
      const { accessToken, user } = await registerRequest({
        name,
        email,
        password,
        phone,
      });
      await saveToken(accessToken);
      set({ user });
      logger.info("Auth", "Registration successful", { userId: user.id });
    } catch (err) {
      logger.warn("Auth", "Registration failed", {
        email,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  },

  logout: async () => {
    const { user } = get();
    logger.info("Auth", "Logout", { userId: user?.id });
    try {
      await logoutRequest();
    } finally {
      await clearToken();
      set({ user: null });
      logger.info("Auth", "Logout complete");
    }
  },
}));
