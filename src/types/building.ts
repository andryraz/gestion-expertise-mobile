export type Building = {
  id: string;
  missionId: string;
  name: string;
  address?: string | null;
  buildingType?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBuildingPayload = {
  name: string;
  address?: string;
  buildingType?: string;
  gpsLat?: number;
  gpsLng?: number;
};

export type UpdateBuildingPayload = {
  name?: string;
  address?: string | null;
  buildingType?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
};
