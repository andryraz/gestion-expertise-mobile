export type FicheType = "GROS_OEUVRE" | "SECOND_OEUVRE";

export type MaterialOption = {
  id: string;
  name: string;
  orderIndex: number | null;
};

export type OuvrageCategory = {
  id: string;
  ficheType: FicheType;
  name: string;
  parentCategoryId: string | null;
  orderIndex: number | null;
  materialOptions: MaterialOption[];
  children: OuvrageCategory[];
};

export type SelectedMaterialOption = {
  id: string;
  name: string;
  orderIndex: number | null;
  category: {
    id: string;
    name: string;
    ficheType: FicheType;
    parentCategoryId?: string | null;
    orderIndex?: number | null;
  };
};

/**
 * Sélection technique : rattachée au bâtiment OU à une zone (XOR métier,
 * exactement un des deux est renseigné). `copiedFromId` trace une copie
 * explicite depuis le niveau parent (héritage par copie) : une fois
 * copiée, la ligne est totalement indépendante de sa source.
 */
export type TechnicalSelection = {
  id: string;
  buildingId: string | null;
  zoneId: string | null;
  copiedFromId: string | null;
  materialOption: SelectedMaterialOption;
  note?: string | null;
  createdAt: string;
};

/** Cible d'une sélection technique : bâtiment ou zone (n'importe quelle profondeur). */
export type SelectionTarget =
  | { kind: "building"; buildingId: string }
  | { kind: "zone"; zoneId: string; buildingId: string };

/** Réponse de POST /zones/{zoneId}/technical-selections/copy-from-parent. */
export type CopyFromParentResult = {
  copiedCount: number;
  /** Présent uniquement quand rien n'a été copié (parent vide ou déjà à jour). */
  message?: string;
};

export type CreateTechnicalSelectionPayload = {
  materialOptionId: string;
  note?: string;
};

export function isZoneSelection(
  selection: TechnicalSelection,
): selection is TechnicalSelection & { zoneId: string } {
  return selection.zoneId !== null;
}

export type UpdateTechnicalSelectionPayload = {
  note?: string | null;
};
