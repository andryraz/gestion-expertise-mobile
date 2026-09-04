import { create } from "zustand";

import { ApiError } from "@/services/api-client";
import { getBuildingZonesTree } from "@/services/zone-services";
import type { ZoneTreeNode } from "@/types/zone";
import { logger } from "@/utils/logger";

type ZonesState = {
  treesByBuilding: Record<string, ZoneTreeNode[]>;
  loadingByBuilding: Record<string, boolean>;
  errorByBuilding: Record<string, string | null>;
  fetchTree: (buildingId: string) => Promise<void>;
};

export const EMPTY_ZONE_TREE: ZoneTreeNode[] = [];

export const useZonesStore = create<ZonesState>((set) => ({
  treesByBuilding: {},
  loadingByBuilding: {},
  errorByBuilding: {},

  fetchTree: async (buildingId) => {
    if (!buildingId) return;

    set((state) => ({
      loadingByBuilding: { ...state.loadingByBuilding, [buildingId]: true },
      errorByBuilding: { ...state.errorByBuilding, [buildingId]: null },
    }));

    try {
      const result = await getBuildingZonesTree(buildingId);
      set((state) => ({
        treesByBuilding: { ...state.treesByBuilding, [buildingId]: result },
      }));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de charger les zones";
      set((state) => ({
        errorByBuilding: { ...state.errorByBuilding, [buildingId]: message },
      }));
      logger.error("Zones", "Échec du chargement de l'arbre des zones", {
        buildingId,
        message,
      });
    } finally {
      set((state) => ({
        loadingByBuilding: { ...state.loadingByBuilding, [buildingId]: false },
      }));
    }
  },
}));
