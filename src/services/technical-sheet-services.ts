import { apiRequest } from "@/services/api-client";
import type {
  CreateTechnicalSelectionPayload,
  FicheType,
  OuvrageCategory,
  TechnicalSelection,
  UpdateTechnicalSelectionPayload,
} from "@/types/technical-sheet";

/**
 * Arbre du catalogue des fiches techniques (désignations d'ouvrages +
 * matériaux). Référentiel global : aucune vérification d'appartenance.
 * Sans `ficheType`, le backend renvoie les deux arbres séparément.
 */
export function getOuvrageCategoryTree(ficheType?: FicheType) {
  const query = ficheType ? `?ficheType=${ficheType}` : "";
  return apiRequest<OuvrageCategory[]>(`/ouvrage-categories${query}`, {
    auth: true,
  });
}

export function getBuildingTechnicalSelections(buildingId: string) {
  return apiRequest<TechnicalSelection[]>(
    `/buildings/${buildingId}/technical-selections`,
    { auth: true },
  );
}

export function createTechnicalSelection(
  buildingId: string,
  payload: CreateTechnicalSelectionPayload,
) {
  return apiRequest<TechnicalSelection>(
    `/buildings/${buildingId}/technical-selections`,
    { method: "POST", body: payload, auth: true },
  );
}

export function updateTechnicalSelection(
  selectionId: string,
  payload: UpdateTechnicalSelectionPayload,
) {
  return apiRequest<TechnicalSelection>(`/technical-selections/${selectionId}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteTechnicalSelection(selectionId: string) {
  return apiRequest<void>(`/technical-selections/${selectionId}`, {
    method: "DELETE",
    auth: true,
  });
}
