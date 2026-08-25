export function parseSafeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj["seconds"] === "number") {
      return new Date(obj["seconds"] * 1000);
    }
    if (typeof obj["$date"] === "string") {
      const d = new Date(obj["$date"]);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

export function formatQuoteDateTime(value: unknown): string {
  const d = parseSafeDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("fr-MG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatQuoteDate(value: unknown): string {
  const d = parseSafeDate(value);
  if (!d) return "";
  return d.toLocaleDateString("fr-MG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
