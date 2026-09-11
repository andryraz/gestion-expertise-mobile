import { apiRequest } from "@/services/api-client";
import type {
  CopyFromParentResult,
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

/**
 * Sélections propres à une zone (n'importe quelle profondeur de
 * sous-zone) : liste plate, SANS les sélections du parent — l'héritage
 * se fait par copie explicite via `copyZoneTechnicalSelectionsFromParent`.
 */
export function getZoneTechnicalSelections(zoneId: string) {
  return apiRequest<TechnicalSelection[]>(
    `/zones/${zoneId}/technical-selections`,
    { auth: true },
  );
}

/** Coche une option pour une zone. 409 si déjà cochée pour cette zone. */
export function createZoneTechnicalSelection(
  zoneId: string,
  payload: CreateTechnicalSelectionPayload,
) {
  return apiRequest<TechnicalSelection>(
    `/zones/${zoneId}/technical-selections`,
    { method: "POST", body: payload, auth: true },
  );
}

/**
 * Duplique les sélections du niveau au-dessus (zone parente, ou bâtiment
 * pour une zone racine) en lignes propres à cette zone. Ne copie que ce
 * qui manque : relançable sans écraser les personnalisations.
 */
export function copyZoneTechnicalSelectionsFromParent(zoneId: string) {
  return apiRequest<CopyFromParentResult>(
    `/zones/${zoneId}/technical-selections/copy-from-parent`,
    { method: "POST", auth: true },
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
