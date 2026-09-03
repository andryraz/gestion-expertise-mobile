export type ZoneType =
  | "ETAGE"
  | "PIECE"
  | "FACADE"
  | "TOITURE"
  | "FONDATION"
  | "TERRAIN"
  | "CLOTURE"
  | "AUTRE";

export type Zone = {
  id: string;
  buildingId: string;
  parentZoneId: string | null;
  name: string;
  zoneType: ZoneType;
  createdAt: string;
  updatedAt: string;
};

export type ZoneTreeNode = Zone & {
  children: ZoneTreeNode[];
};

export type CreateZonePayload = {
  name: string;
  zoneType: ZoneType;
  parentZoneId?: string | null;
};

export type UpdateZonePayload = {
  name?: string;
  zoneType?: ZoneType;
  parentZoneId?: string | null;
};
