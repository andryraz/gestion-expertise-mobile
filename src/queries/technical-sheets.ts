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
 * Mutation unique "toggle" : selon l'état actuel de la case, on POST
 * (coche) ou on DELETE (décoche). Toute mutation resynchronise la liste
 * des sélections du bâtiment via le cache invalidé.
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
    onSettled: () => {
      // Resynchronisation systématique (y compris en cas d'erreur) pour
      // garantir la cohérence des cases à cocher avec le backend.
      queryClient.invalidateQueries({
        queryKey: technicalSheetKeys.selections(buildingId),
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
