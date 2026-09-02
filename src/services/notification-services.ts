import { Platform } from "react-native";

import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
} from "@/types/appointment";
import { logger } from "@/utils/logger";

const CHANNEL_ID = "appointment-reminders";
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

const ACTIVE_STATUSES: AppointmentStatus[] = ["PLANIFIE", "CONFIRME"];

const APPOINTMENT_TYPE_SHORT: Record<AppointmentType, string> = {
  APPEL: "Appel",
  VISITE_RECONNAISSANCE: "Visite de reconnaissance",
  RENDEZ_VOUS_SITE: "Rendez-vous sur site",
  AUTRE: "Rendez-vous",
};

/**
 * Vérifie si les notifications push sont supportées sur la plateforme
 * courante. Sur Expo Go (Android SDK 53+) et le web, expo-notifications
 * n'est pas disponible — on retourne false pour que tous les appels
 * soient des no-op au lieu de crasher.
 */
let NotificationsModule: typeof import("expo-notifications") | null = null;
let notificationsChecked = false;

/**
 * Tente d'importer expo-notifications de manière lazy.
 * Retourne null si le module n'est pas disponible (Expo Go, web…).
 */
async function getNotificationsModule(): Promise<typeof import("expo-notifications") | null> {
  if (notificationsChecked) return NotificationsModule;
  notificationsChecked = true;

  // Pas de support web
  if (Platform.OS === "web") return null;

  try {
    const mod = await import("expo-notifications");
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    NotificationsModule = mod;
    return mod;
  } catch (err) {
    logger.warn(
      "Notifications",
      "expo-notifications non disponible sur cette plateforme",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

function reminderIdentifier(appointmentId: string): string {
  return `appointment-reminder-${appointmentId}`;
}

function reminderBody(appointment: Appointment): string {
  const time = new Date(appointment.scheduledAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const typeLabel = APPOINTMENT_TYPE_SHORT[appointment.type] ?? "Rendez-vous";
  return appointment.location
    ? `${typeLabel} à ${time} — ${appointment.location}`
    : `${typeLabel} à ${time}`;
}

export async function ensureNotificationSetup(): Promise<boolean> {
  const N = await getNotificationsModule();
  if (!N) return false;

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Rappels de rendez-vous",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await N.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await N.requestPermissionsAsync();
  if (status !== "granted") {
    logger.info("Notifications", "Permission notifications refusée");
    return false;
  }
  return true;
}

export async function scheduleAppointmentReminder(
  appointment: Appointment,
): Promise<void> {
  const N = await getNotificationsModule();
  if (!N) return;

  const identifier = reminderIdentifier(appointment.id);

  await N.cancelScheduledNotificationAsync(identifier).catch(
    () => {},
  );

  if (!ACTIVE_STATUSES.includes(appointment.status)) return;

  const reminderDate = new Date(
    new Date(appointment.scheduledAt).getTime() - REMINDER_LEAD_MS,
  );
  if (reminderDate.getTime() <= Date.now()) return;

  try {
    await N.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Rendez-vous demain",
        body: reminderBody(appointment),
        data: {
          appointmentId: appointment.id,
          missionId: appointment.missionId,
        },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: CHANNEL_ID,
      },
    });
  } catch (err) {
    logger.error("Notifications", "Échec planification rappel", {
      id: appointment.id,
      err: err instanceof Error ? err.message : err,
    });
  }
}

export async function cancelAppointmentReminder(
  appointmentId: string,
): Promise<void> {
  const N = await getNotificationsModule();
  if (!N) return;

  await N.cancelScheduledNotificationAsync(
    reminderIdentifier(appointmentId),
  ).catch(() => {});
}

export async function syncAppointmentReminders(
  appointments: Appointment[],
): Promise<void> {
  await Promise.all(appointments.map((a) => scheduleAppointmentReminder(a)));
}
