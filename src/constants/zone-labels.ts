import { Ionicons } from "@expo/vector-icons";

import type { ZoneType } from "@/types/zone";

export const ZONE_TYPES: ZoneType[] = [
  "ETAGE",
  "PIECE",
  "FACADE",
  "TOITURE",
  "FONDATION",
  "TERRAIN",
  "CLOTURE",
  "AUTRE",
];

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  ETAGE: "Étage",
  PIECE: "Pièce",
  FACADE: "Façade",
  TOITURE: "Toiture",
  FONDATION: "Fondation",
  TERRAIN: "Terrain",
  CLOTURE: "Clôture",
  AUTRE: "Autre",
};

export const ZONE_TYPE_ICONS: Record<ZoneType, keyof typeof Ionicons.glyphMap> = {
  ETAGE: "layers-outline",
  PIECE: "albums-outline",
  FACADE: "business-outline",
  TOITURE: "triangle-outline",
  FONDATION: "cube-outline",
  TERRAIN: "earth-outline",
  CLOTURE: "shield-outline",
  AUTRE: "help-circle-outline",
};