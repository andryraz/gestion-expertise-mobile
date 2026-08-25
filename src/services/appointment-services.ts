import { apiRequest } from "@/services/api-client";
import { Appointment, CreateAppointmentPayload, UpdateAppointmentPayload } from "@/types/appointment";

export function getAppointments(from: string, to: string) {
  const query = new URLSearchParams({ from, to }).toString();
  return apiRequest<Appointment[]>(`/appointments?${query}`, { auth: true });
}

export function getAppointment(appointmentId: string) {
  return apiRequest<Appointment>(
    `/appointments/${appointmentId}`,
    { auth: true },
  );
}

export function getMissionAppointments(missionId: string) {
  return apiRequest<Appointment[]>(
    `/missions/${missionId}/appointments`,
    { auth: true },
  );
}

export function createAppointment(missionId: string, payload: CreateAppointmentPayload) {
  return apiRequest<Appointment>(
    `/missions/${missionId}/appointments`,
    {
      method: "POST",
      body: payload,
      auth: true,
    },
  );
}

export function updateAppointment(appointmentId: string, payload: UpdateAppointmentPayload) {
  return apiRequest<Appointment>(
    `/appointments/${appointmentId}`,
    {
      method: "PATCH",
      body: payload,
      auth: true,
    },
  );
}
