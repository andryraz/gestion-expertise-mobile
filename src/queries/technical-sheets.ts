import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  copyZoneTechnicalSelectionsFromParent,
  createTechnicalSelection,
  createZoneTechnicalSelection,
  deleteTechnicalSelection,
  getBuildingTechnicalSelections,
  getOuvrageCategoryTree,
  getZoneTechnicalSelections,
  updateTechnicalSelection,
} from "@/services/technical-sheet-services";
import type {
  CopyFromParentResult,
  CreateTechnicalSelectionPayload,
  FicheType,
  OuvrageCategory,
  SelectionTarget,
  TechnicalSelection,
  UpdateTechnicalSelectionPayload,
} from "@/types/technical-sheet";

/**
 * Identifiant (préfixe) des sélections insérées de façon optimiste dans
 * le cache, en attendant la réponse du backend.
 */
const OPTIMISTIC_ID_PREFIX = "optimistic-";

export const technicalSheetKeys = {
  all: ["technical-sheets"] as const,
  catalog: (ficheType: FicheType) =>
    [...technicalSheetKeys.all, "catalog", ficheType] as const,
  buildingSelections: (buildingId: string) =>
    ["buildings", buildingId, "technical-selections"] as const,
  zoneSelections: (zoneId: string) =>
    ["zones", zoneId, "technical-selections"] as const,
  selections: (target: SelectionTarget) =>
    target.kind === "zone"
      ? technicalSheetKeys.zoneSelections(target.zoneId)
      : technicalSheetKeys.buildingSelections(target.buildingId),
};

/**
 * Catalogue des ouvrages : référentiel qui ne change jamais en usage
 * normal, on le garde "frais" 24h pour éviter tout refetch inutile.
 */
const CATALOG_STALE_TIME = 24 * 60 * 60 * 1000;

export function useOuvrageCatalog(ficheType: FicheType) {
  return useQuery({
    queryKey: technicalSheetKeys.catalog(ficheType),
    queryFn: () => getOuvrageCategoryTree(ficheType),
    staleTime: CATALOG_STALE_TIME,
  });
}

/** Sélections propres au bâtiment (sans les zones). */
export function useBuildingTechnicalSelections(buildingId: string) {
  return useQuery({
    queryKey: technicalSheetKeys.buildingSelections(buildingId),
    queryFn: () => getBuildingTechnicalSelections(buildingId),
    enabled: !!buildingId,
  });
}

/**
 * Sélections propres à une zone (n'importe quelle profondeur de
 * sous-zone) : le backend ne renvoie QUE les lignes de cette zone (les
 * sélections du parent ne sont PAS incluses) — l'héritage est matérialisé
 * par la copie explicite via `useCopyFromParent`.
 */
export function useZoneTechnicalSelections(zoneId: string) {
  return useQuery({
    queryKey: technicalSheetKeys.zoneSelections(zoneId),
    queryFn: () => getZoneTechnicalSelections(zoneId),
    enabled: !!zoneId,
  });
}

/**
 * Construit la sélection optimiste insérée dans le cache pendant le POST,
 * avec le bon rattachement (buildingId XOR zoneId) selon la cible.
 * `category` est factice car rien ne l'affiche côté client ; l'entrée
 * réelle du backend la complètera.
 */
function buildOptimisticSelection(
  target: SelectionTarget,
  materialOptionId: string,
): TechnicalSelection {
  const isZone = target.kind === "zone";
  return {
    id: `${OPTIMISTIC_ID_PREFIX}${materialOptionId}`,
    buildingId: isZone ? null : target.buildingId,
    zoneId: isZone ? target.zoneId : null,
    copiedFromId: null,
    materialOption: {
      id: materialOptionId,
      name: "",
      orderIndex: null,
      category: {
        id: "",
        name: "",
        ficheType: "GROS_OEUVRE",
      },
    },
    note: null,
    createdAt: "",
  };
}

/**
 * Mutation unique "toggle" avec mise à jour optimiste, générique
 * bâtiment / zone : la case change INSTANTANÉMENT dans le cache (aucun
 * délai perceptible), l'appel réseau part en arrière-plan.
 *
 * - Coche   → insertion optimiste dans le cache, puis POST.
 * - Décoche → retrait immédiat du cache, puis DELETE.
 *
 * En cas d'échec, seule la case concernée est restaurée (rollback
 * chirurgical), sans refetch ni spinner global. En cas de succès, aucune
 * invalidation : le cache est déjà à jour (un refetch ferait clignoter
 * les cases) ; l'écran resynchronise de toute façon à chaque focus.
 */
export function useToggleTechnicalSelection(target: SelectionTarget) {
  const queryClient = useQueryClient();
  const selectionsKey = technicalSheetKeys.selections(target);

  const createForTarget = (payload: CreateTechnicalSelectionPayload) =>
    target.kind === "zone"
      ? createZoneTechnicalSelection(target.zoneId, payload)
      : createTechnicalSelection(target.buildingId, payload);

  return useMutation({
    mutationFn: async ({
      materialOptionId,
      selection,
    }: {
      materialOptionId: string;
      /** Sélection existante pour cette option, si déjà cochée. */
      selection?: TechnicalSelection;
    }) => {
      if (selection) {
        await deleteTechnicalSelection(selection.id);
        return null;
      }
      return createForTarget({ materialOptionId });
    },
    onMutate: async ({ materialOptionId, selection }) => {
      // Annule les refetch en cours pour éviter qu'ils n'écrasent l'état
      // optimiste avec des données périmées.
      await queryClient.cancelQueries({ queryKey: selectionsKey });

      queryClient.setQueryData<TechnicalSelection[]>(selectionsKey, (old) => {
        if (selection) {
          // Décoche : retrait immédiat de la sélection existante.
          return old?.filter((s) => s.id !== selection.id);
        }
        // Coche : insertion optimiste (id provisoire). onSuccess la
        // remplacera par la sélection réelle renvoyée par le backend.
        return [
          ...(old ?? []),
          buildOptimisticSelection(target, materialOptionId),
        ];
      });
    },
    onSuccess: (created, { materialOptionId, selection }) => {
      queryClient.setQueryData<TechnicalSelection[]>(selectionsKey, (old) => {
        if (!created) {
          // Décoche : retire la sélection supprimée côté backend (au
          // cas où un refetch l'aurait réinsérée entre-temps).
          return selection
            ? (old ?? []).filter((s) => s.id !== selection.id)
            : old;
        }
        // Coche : remplace l'entrée optimiste par la sélection réelle ;
        // si un refetch l'a déjà fait disparaître (course avec le
        // focus), on la réinsère pour rester cohérent avec le backend.
        return [
          ...(old ?? []).filter(
            (s) =>
              s.materialOption.id !== materialOptionId ||
              !s.id.startsWith(OPTIMISTIC_ID_PREFIX),
          ),
          created,
        ];
      });
    },
    onError: (_err, { materialOptionId, selection }) => {
      // Rollback chirurgical : uniquement la case concernée, sans toucher
      // aux autres toggles éventuellement en vol.
      queryClient.setQueryData<TechnicalSelection[]>(selectionsKey, (old) => {
        if (selection) {
          // Décoche échoué → on remet la sélection enlevée.
          if (!old) return [selection];
          return old.some((s) => s.id === selection.id)
            ? old
            : [...old, selection];
        }
        // Coche échoué → on retire l'entrée optimiste.
        return (old ?? []).filter(
          (s) =>
            s.materialOption.id !== materialOptionId ||
            !s.id.startsWith(OPTIMISTIC_ID_PREFIX),
        );
      });
    },
  });
}

export function useUpdateTechnicalSelection(target: SelectionTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      selectionId,
      payload,
    }: {
      selectionId: string;
      payload: UpdateTechnicalSelectionPayload;
    }) => updateTechnicalSelection(selectionId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(target),
        (old) =>
          old?.map((selection) =>
            selection.id === updated.id ? updated : selection,
          ),
      );
    },
  });
}

export function useDeleteTechnicalSelection(target: SelectionTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (selectionId: string) => deleteTechnicalSelection(selectionId),
    onSuccess: (_result, selectionId) => {
      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(target),
        (old) => old?.filter((selection) => selection.id !== selectionId),
      );
    },
  });
}

/**
 * Verrou module-scope anti double-appel de copy-from-parent : en plus du
 * verrouillage au niveau écran (bouton désactivé pendant la mutation),
 * ce verrou couvre les courses entre le déclenchement automatique à
 * l'ouverture et un tap sur le bouton, ou entre deux montages rapprochés
 * de l'écran — un seul appel réseau par zone à la fois, même entre deux
 * instances du hook.
 */
const copyInFlightByZone = new Set<string>();

/**
 * Copie les sélections du niveau au-dessus (zone parente, ou bâtiment
 * pour une zone racine) vers cette zone. Le backend ne copie que ce qui
 * manque : relançable sans écraser les personnalisations ; en cas de
 * double appel concurrent, le verrou module-scope garantit qu'un seul
 * requête part (le second appel est no-op).
 */
export function useCopyFromParent(zoneId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CopyFromParentResult | null> => {
      // Un appel est déjà en vol pour cette zone (auto-copy + tap
      // concurrent, double montage…) → no-op, pas de second réseau.
      if (copyInFlightByZone.has(zoneId)) return null;
      copyInFlightByZone.add(zoneId);
      try {
        return await copyZoneTechnicalSelectionsFromParent(zoneId);
      } finally {
        copyInFlightByZone.delete(zoneId);
      }
    },
    onSuccess: (result) => {
      if (!result) return; // Appel doublonné ignoré.
      // La copie crée de nouvelles lignes propres à la zone : le cache
      // local ne peut pas les déduire → resynchronisation de la zone.
      queryClient.invalidateQueries({
        queryKey: technicalSheetKeys.zoneSelections(zoneId),
      });
    },
  });
}

/** Recherche la sélection existante d'une option de matériau donnée. */
export function findSelectionByMaterialOptionId(
  selections: TechnicalSelection[] | undefined,
  materialOptionId: string,
): TechnicalSelection | undefined {
  return selections?.find(
    (selection) => selection.materialOption.id === materialOptionId,
  );
}

/** Aplatit l'arbre du catalogue (utile pour compter les cases cochées). */
export function flattenOuvrageCategories(
  tree: OuvrageCategory[],
): { category: OuvrageCategory; depth: number }[] {
  const result: { category: OuvrageCategory; depth: number }[] = [];
  const walk = (nodes: OuvrageCategory[], depth: number) => {
    for (const node of nodes) {
      result.push({ category: node, depth });
      walk(node.children ?? [], depth + 1);
    }
  };
  walk(tree, 0);
  return result;
}
