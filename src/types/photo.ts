export type Photo = {
  id: string;
  missionId: string;
  zoneId: string | null;
  filePath: string;
  annotations?: {
    orientation?: string;
    niveau?: string;
    [key: string]: unknown;
  } | null;
  takenAt: string;
  caption?: string | null;
  createdAt: string;
};

export type UploadPhotoPayload = {
  uri: string;
  zoneId?: string | null;
  caption?: string;
  annotation?: string;
};

export type AttachPhotoPayload = {
  zoneId?: string | null;
};

export type UpdatePhotoPayload = {
  caption?: string | null;
};

export type PendingPhoto = {
  localId: string;
  missionId: string;
  zoneId: string | null;
  uri: string;
  failedAt: string;
};
