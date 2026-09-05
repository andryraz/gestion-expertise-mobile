import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { APPOINTMENT_TYPE_LABELS } from "@/constants/appointment-labels";
import { useTheme } from "@/hooks/use-theme";
import { useUpdateAppointment } from "@/queries/appointments";
import { ApiError } from "@/services/api-client";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { formatDate, formatTime } from "@/utils/calendar-date";
import { logger } from "@/utils/logger";

import { StatusBadge } from "./status-badge";

const STATUSES: AppointmentStatus[] = [
  "PLANIFIE",
  "CONFIRME",
  "REALISE",
  "ANNULE",
  "REPORTE",
];

type StatusEditModalProps = {
  appointment: Appointment | null;
  visible: boolean;
  onClose: () => void;
  onStatusUpdated: (updated: Appointment) => void;
};

export function StatusEditModal({
  appointment,
  visible,
  onClose,
  onStatusUpdated,
}: StatusEditModalProps) {
  const theme = useTheme();
  const updateAppointmentMutation = useUpdateAppointment();

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (!appointment) return;
    try {
      const updated = await updateAppointmentMutation.mutateAsync({
        appointmentId: appointment.id,
        payload: { status: newStatus },
      });
      onStatusUpdated(updated);
      logger.info("RDV", "Statut rendez-vous mis à jour", {
        id: appointment.id,
        status: newStatus,
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de mettre à jour le statut";
      Alert.alert("Erreur", message);
      logger.error("RDV", "Échec de la mise à jour du statut", {
        id: appointment.id,
        message,
      });
    }
  };

  if (!visible || !appointment) return null;

  return (
    <Pressable
      className="absolute inset-0 items-center justify-center z-50"
      onPress={onClose}
    >
      <View className="absolute inset-0 bg-black/50" />
      <ThemedView
        type="background"
        className="rounded-three border border-border dark:border-border-dark p-four mx-four"
        style={{ elevation: 8 }}
      >
        <ThemedText type="smallBold" className="text-base mb-three">
          Modifier le statut
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" className="mb-two">
          {APPOINTMENT_TYPE_LABELS[appointment.type]} –{" "}
          {formatDate(appointment.scheduledAt)} à{" "}
          {formatTime(appointment.scheduledAt)}
        </ThemedText>

        <View className="gap-two">
          {STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => handleUpdateStatus(s)}
              disabled={
                updateAppointmentMutation.isPending || s === appointment.status
              }
              className={`flex-row items-center gap-two rounded-two px-three py-two ${
                s === appointment.status
                  ? "bg-background-selected dark:bg-background-selected-dark"
                  : ""
              }`}
            >
              <StatusBadge status={s} />
              {s === appointment.status && (
                <Ionicons
                  name="checkmark-circle"
                  color={theme.accent}
                  size={16}
                />
              )}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onClose}
          className="mt-three items-center rounded-three py-two"
        >
          <ThemedText type="small" themeColor="textSecondary">
            Fermer
          </ThemedText>
        </Pressable>
      </ThemedView>
    </Pressable>
  );
}
