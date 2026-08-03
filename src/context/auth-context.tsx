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
        token ? "Token trouvé au démarrage" : "Aucun token au démarrage",
      );
    });
  }, []);

  // async function login(email: string, password: string) {
  //   const { accessToken, user } = await loginRequest({ email, password });
  //   await saveToken(accessToken);
  //   setUser(user);
  // }
  async function login(email: string, password: string) {
    logger.info("Auth", `Tentative de connexion`, { email });
    try {
      const { accessToken, user } = await loginRequest({ email, password });
      await saveToken(accessToken);
      setUser(user);
      logger.info("Auth", `Connexion réussie`, {
        userId: user.id,
        token: maskToken(accessToken),
      });
    } catch (err) {
      logger.warn("Auth", `Échec de connexion`, {
        email,
        error: err instanceof Error ? err.message : err,
      });
      throw err; // on relance pour que l'écran gère l'affichage de l'erreur
    }
  }

  // async function register(
  //   name: string,
  //   email: string,
  //   password: string,
  //   phone?: string,
  // ) {
  //   const { accessToken, user } = await registerRequest({
  //     name,
  //     email,
  //     password,
  //     phone,
  //   });
  //   await saveToken(accessToken);
  //   setUser(user);
  // }

  async function register(
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) {
    logger.info("Auth", `Tentative d'inscription`, { email });
    try {
      const { accessToken, user } = await registerRequest({
        name,
        email,
        password,
        phone,
      });
      await saveToken(accessToken);
      setUser(user);
      logger.info("Auth", `Inscription réussie`, { userId: user.id });
    } catch (err) {
      logger.warn("Auth", `Échec d'inscription`, {
        email,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  }
  async function logout() {
    logger.info("Auth", `Déconnexion`, { userId: user?.id });
    try {
      await logoutRequest();
    } finally {
      await clearToken();
      setUser(null);
      logger.info("Auth", `Déconnexion terminée`);
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
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
