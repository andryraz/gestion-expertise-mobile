import type { Building } from "@/types/building";

export function formatBuildingSummary(
  buildings: Building[],
  variant: "short" | "long" = "short",
): string {
  if (buildings.length === 0) return "Lieu non renseigné";

  const [first, ...rest] = buildings;
  const extra = rest.length;

  if (!first.address) {
    return extra > 0
      ? `${buildings.length} bâtiments`
      : "Adresse non renseignée";
  }

  if (extra === 0) return first.address;

  return variant === "long"
    ? `${first.address} et ${extra} autre${extra > 1 ? "s" : ""}`
    : `${first.address} +${extra}`;
}
