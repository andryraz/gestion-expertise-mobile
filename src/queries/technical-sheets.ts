import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTechnicalSelection,
  deleteTechnicalSelection,
  getBuildingTechnicalSelections,
  getOuvrageCategoryTree,
  updateTechnicalSelection,
} from "@/services/technical-sheet-services";
import type {
  CreateTechnicalSelectionPayload,
  FicheType,
  OuvrageCategory,
  TechnicalSelection,
  UpdateTechnicalSelectionPayload,
} from "@/types/technical-sheet";

export const technicalSheetKeys = {
  all: ["technical-sheets"] as const,
  catalog: (ficheType: FicheType) =>
    [...technicalSheetKeys.all, "catalog", ficheType] as const,
  selections: (buildingId: string) =>
    ["buildings", buildingId, "technical-selections"] as const,
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

export function useTechnicalSelections(buildingId: string) {
  return useQuery({
    queryKey: technicalSheetKeys.selections(buildingId),
    queryFn: () => getBuildingTechnicalSelections(buildingId),
    enabled: !!buildingId,
  });
}

export function useCreateTechnicalSelection(buildingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTechnicalSelectionPayload) =>
      createTechnicalSelection(buildingId, payload),
    onSuccess: (created) => {
      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(buildingId),
        (old) => (old ? [...old, created] : [created]),
      );
    },
  });
}

export function useUpdateTechnicalSelection(buildingId: string) {
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
        technicalSheetKeys.selections(buildingId),
        (old) =>
          old?.map((selection) =>
            selection.id === updated.id ? updated : selection,
          ),
      );
    },
  });
}

export function useDeleteTechnicalSelection(buildingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (selectionId: string) =>
      deleteTechnicalSelection(selectionId),
    onSuccess: (_result, selectionId) => {
      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(buildingId),
        (old) => old?.filter((selection) => selection.id !== selectionId),
      );
    },
  });
}

/**
 * Identifiant (préfixe) des sélections insérées de façon optimiste dans
 * le cache, en attendant la réponse du backend.
 */
const OPTIMISTIC_ID_PREFIX = "optimistic-";

/**
 * Mutation unique "toggle" avec mise à jour optimiste : la case change
 * INSTANTANÉMENT dans le cache (aucun délai perceptible), l'appel réseau
 * part en arrière-plan.
 *
 * - Coche   → insertion optimiste dans le cache, puis POST.
 * - Décoche → retrait immédiat du cache, puis DELETE.
 *
 * En cas d'échec, seule la case concernée est restaurée (rollback
 * chirurgical), sans refetch ni spinner global. En cas de succès, aucune
 * invalidation : le cache est déjà à jour (un refetch ferait clignoter
 * les cases) ; l'écran resynchronise de toute façon à chaque focus.
 */
export function useToggleTechnicalSelection(buildingId: string) {
  const queryClient = useQueryClient();

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
      return createTechnicalSelection(buildingId, { materialOptionId });
    },
    onMutate: async ({ materialOptionId, selection }) => {
      // Annule les refetch en cours pour éviter qu'ils n'écrasent l'état
      // optimiste avec des données périmées.
      await queryClient.cancelQueries({
        queryKey: technicalSheetKeys.selections(buildingId),
      });

      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(buildingId),
        (old) => {
          if (selection) {
            // Décoche : retrait immédiat de la sélection existante.
            return old?.filter((s) => s.id !== selection.id);
          }
          // Coche : insertion optimiste (id provisoire). onSuccess la
          // remplacera par la sélection réelle renvoyée par le backend.
          // `category` est factice car rien ne l'affiche côté client ;
          // l'entrée réelle du backend la complètera.
          const optimistic: TechnicalSelection = {
            id: `${OPTIMISTIC_ID_PREFIX}${materialOptionId}`,
            buildingId,
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
          return [...(old ?? []), optimistic];
        },
      );
    },
    onSuccess: (created, { materialOptionId, selection }) => {
      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(buildingId),
        (old) => {
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
        },
      );
    },
    onError: (_err, { materialOptionId, selection }) => {
      // Rollback chirurgical : uniquement la case concernée, sans toucher
      // aux autres toggles éventuellement en vol.
      queryClient.setQueryData<TechnicalSelection[]>(
        technicalSheetKeys.selections(buildingId),
        (old) => {
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
        },
      );
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
