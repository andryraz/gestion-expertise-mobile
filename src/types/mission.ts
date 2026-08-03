export type MissionStatus =
  | "BROUILLON"
  | "PRISE_DE_CONTACT"
  | "DEVIS_EN_PREPARATION"
  | "DEVIS_ENVOYE"
  | "ACCEPTEE"
  | "REFUSEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ENVOYEE";

export type MissionBrief = {
  id: string;
  reference: string;
  title: string;
};

export type ExpertBrief = {
  id: string;
  name: string;
  email: string;
};

export type Mission = {
  id: string;
  reference: string;
  title: string;
  missionType: string;
  status: MissionStatus;
  buildingAddress?: string | null;
  buildingType?: string | null;
  expertId: string;
  expert: ExpertBrief;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type PaginatedMissions = {
  data: Mission[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type MissionsStats = {
  total: number;
  byStatus: { status: MissionStatus; count: number }[];
  pendingClientResponse: { count: number; missions: MissionBrief[] };
  overdue: { count: number; missions: MissionBrief[] };
  archived: { count: number };
};
