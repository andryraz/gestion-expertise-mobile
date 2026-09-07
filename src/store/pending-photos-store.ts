import { create } from "zustand";

import type { PendingPhoto } from "@/types/photo";
import { logger } from "@/utils/logger";

type PendingPhotosState = {
  pending: PendingPhoto[];
  addPending: (
    photo: Omit<PendingPhoto, "localId" | "failedAt"> & { localId?: string },
  ) => string;
  removePending: (localId: string) => void;
  clearForMission: (missionId: string) => void;
};

/**
 * Store local des captures en échec d'upload. Une photo prise n'est JAMAIS
 * perdue : si l'envoi échoue (réseau hors ligne, timeout, erreur serveur),
 * elle reste ici jusqu'à une relance réussie ou un abandon explicite.
 * L'URI locale (cache de l'app) reste valide le temps de la session.
 */
export const usePendingPhotosStore = create<PendingPhotosState>((set) => ({
  pending: [],

  addPending: (photo) => {
    const localId =
      photo.localId ??
      `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => {
      // Évite les doubles si la même URI est ajoutée deux fois (relance
      // manuelle après un premier échec déjà enregistré).
      const filtered = state.pending.filter((p) => p.uri !== photo.uri);
      return {
        pending: [
          {
            ...photo,
            localId,
            failedAt: new Date().toISOString(),
          },
          ...filtered,
        ],
      };
    });
    logger.warn("Photos", "Photo mise en attente (upload échoué)", {
      localId,
      missionId: photo.missionId,
    });
    return localId;
  },

  removePending: (localId) =>
    set((state) => ({
      pending: state.pending.filter((p) => p.localId !== localId),
    })),

  clearForMission: (missionId) =>
    set((state) => ({
      pending: state.pending.filter((p) => p.missionId !== missionId),
    })),
}));
