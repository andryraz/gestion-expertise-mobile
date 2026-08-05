import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  User,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "@/services/auth-service";
import { clearToken, getToken, saveToken } from "@/services/token-storage";
import { logger, maskToken } from "@/utils/logger";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => {
      setIsLoading(false);
      logger.debug(
        "Auth",
        token ? "Token found on startup" : "No token on startup",
      );
    });
  }, []);

  async function login(email: string, password: string) {
    logger.info("Auth", "Login attempt", { email });
    try {
      const { accessToken, user } = await loginRequest({ email, password });
      await saveToken(accessToken);
      setUser(user);
      logger.info("Auth", "Login successful", {
        userId: user.id,
        token: maskToken(accessToken),
      });
    } catch (err) {
      logger.warn("Auth", "Login failed", {
        email,
        error: err instanceof Error ? err.message : err,
      });
      throw err; // rethrow so the screen can display the error
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) {
    logger.info("Auth", "Registration attempt", { email });
    try {
      const { accessToken, user } = await registerRequest({
        name,
        email,
        password,
        phone,
      });
      await saveToken(accessToken);
      setUser(user);
      logger.info("Auth", "Registration successful", { userId: user.id });
    } catch (err) {
      logger.warn("Auth", "Registration failed", {
        email,
        error: err instanceof Error ? err.message : err,
      });
      throw err; // rethrow so the screen can display the error
    }
  }
  async function logout() {
    logger.info("Auth", "Logout", { userId: user?.id });
    try {
      await logoutRequest();
    } finally {
      await clearToken();
      setUser(null);
      logger.info("Auth", "Logout complete");
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
