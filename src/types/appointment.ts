export type AppointmentType =
  | "APPEL"
  | "VISITE_RECONNAISSANCE"
  | "RENDEZ_VOUS_SITE"
  | "AUTRE";

export type AppointmentStatus =
  | "PLANIFIE"
  | "CONFIRME"
  | "REALISE"
  | "ANNULE"
  | "REPORTE";

export type Appointment = {
  id: string;
  missionId: string;
  type: AppointmentType;
  scheduledAt: string;
  location?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentPayload = {
  type: AppointmentType;
  scheduledAt: string;
  location?: string;
  notes?: string;
};

export type UpdateAppointmentPayload = {
  type?: AppointmentType;
  scheduledAt?: string;
  location?: string;
  notes?: string;
  status?: AppointmentStatus;
};
