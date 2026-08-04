type LogLevel = "debug" | "info" | "warn" | "error";

const COLORS: Record<LogLevel, string> = {
  debug: "#8E8E93",
  info: "#0A84FF",
  warn: "#FF9F0A",
  error: "#FF453A",
};

function timestamp() {
  return new Date().toISOString().split("T")[1].replace("Z", "");
}

function log(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (!__DEV__ && level === "debug") return; // pas de debug en prod

  const prefix = `[${timestamp()}] [${scope}]`;

  if (__DEV__) {
    // %c fonctionne dans la console Metro/Chrome DevTools
    console.log(
      `%c${prefix} ${message}`,
      `color: ${COLORS[level]}`,
      data ?? "",
    );
  } else {
    // en prod : pas de couleur, et on pourrait brancher un service distant ici (Sentry, etc.)
    console.log(`${prefix} ${message}`, data ?? "");
  }
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) =>
    log("debug", scope, message, data),
  info: (scope: string, message: string, data?: unknown) =>
    log("info", scope, message, data),
  warn: (scope: string, message: string, data?: unknown) =>
    log("warn", scope, message, data),
  error: (scope: string, message: string, data?: unknown) =>
    log("error", scope, message, data),
};

// ajoute dans logger.ts
export function maskToken(token: string) {
  if (token.length <= 12) return "***";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}
