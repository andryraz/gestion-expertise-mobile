// La réponse backend (AppointmentResponseDto) ne documente que
// "APPEL" | "RENDEZ_VOUS_SITE" | "AUTRE" pour `type`, mais la création
// (CreateAppointmentDto) accepte aussi "VISITE_RECONNAISSANCE" — vraisemblablement
// un oubli de documentation côté backend plutôt qu'une vraie restriction, donc on
// type ici l'union complète pour ne pas planter l'affichage d'un rendez-vous
// existant de ce type.
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
  // La spec documente `location`/`notes` comme `type: object` avec un exemple
  // qui est une chaîne — probablement une erreur d'annotation Swagger côté
  // backend. On s'aligne sur CreateAppointmentDto (qui les type en string).
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
