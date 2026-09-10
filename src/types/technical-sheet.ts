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

export type TechnicalSelection = {
  id: string;
  buildingId: string;
  materialOption: SelectedMaterialOption;
  note?: string | null;
  createdAt: string;
};

export type CreateTechnicalSelectionPayload = {
  materialOptionId: string;
  note?: string;
};

export type UpdateTechnicalSelectionPayload = {
  note?: string | null;
};
