import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  APPOINTMENT_STATUS_BG,
  APPOINTMENT_STATUS_FG,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "@/constants/appointment-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import {
  getMissionAppointments,
  updateAppointment,
} from "@/services/appointment-services";
import { scheduleAppointmentReminder } from "@/services/notification-services";
import { type Appointment, type AppointmentStatus } from "@/types/appointment";
import { formatDate, formatTime } from "@/utils/calendar-date";
import { logger } from "@/utils/logger";

type MissionRdvTabProps = {
  missionId: string;
  isArchived: boolean;
};

const TYPE_ICONS: Record<string, string> = {
  APPEL: "call",
  VISITE_RECONNAISSANCE: "eye",
  RENDEZ_VOUS_SITE: "location",
  AUTRE: "ellipsis-horizontal",
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <View
      className={`rounded-five px-two py-half ${APPOINTMENT_STATUS_BG[status]}`}
    >
      <ThemedText type="eyebrow" className={APPOINTMENT_STATUS_FG[status]}>
        {APPOINTMENT_STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

function AppointmentRow({
  appointment,
  onPress,
  onReschedule,
}: {
  appointment: Appointment;
  onPress: () => void;
  onReschedule: () => void;
}) {
  const theme = useTheme();
  const canReschedule =
    appointment.status !== "ANNULE" &&
    appointment.status !== "REPORTE" &&
    appointment.status !== "REALISE";

  const renderRightActions = () => {
    if (!canReschedule) return null;
    return (
      <Pressable
        onPress={onReschedule}
        className="items-center justify-center rounded-three px-four"
        style={{ backgroundColor: theme.accent, width: 80 }}
      >
        <Ionicons name="time" color={theme.background} size={20} />
        <ThemedText type="smallBold" themeColor="background">
          Reporter
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Pressable onPress={onPress}>
        <ThemedView
          type="backgroundElement"
          className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
            <Ionicons
              name={TYPE_ICONS[appointment.type] as any}
              color={theme.accent}
              size={18}
            />
          </View>

          <View className="flex-1">
            <ThemedText type="smallBold">
              {APPOINTMENT_TYPE_LABELS[appointment.type]}
            </ThemedText>
            <View className="flex-row items-center gap-one mt-half">
              <Ionicons name="time" color={theme.textSecondary} size={12} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(appointment.scheduledAt)} à{" "}
                {formatTime(appointment.scheduledAt)}
              </ThemedText>
            </View>
            {appointment.location && (
              <View className="flex-row items-center gap-one mt-half">
                <Ionicons
                  name="location"
                  color={theme.textSecondary}
                  size={12}
                />
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={1}
                >
                  {appointment.location}
                </ThemedText>
              </View>
            )}
          </View>

          <StatusBadge status={appointment.status} />
        </ThemedView>
      </Pressable>
    </Swipeable>
  );
}

function StatusEditModal({
  appointment,
  visible,
  onClose,
  onStatusUpdated,
}: {
  appointment: Appointment | null;
  visible: boolean;
  onClose: () => void;
  onStatusUpdated: (updated: Appointment) => void;
}) {
  const theme = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (!appointment) return;
    setIsUpdating(true);
    try {
      const updated = await updateAppointment(appointment.id, {
        status: newStatus,
      });
      await scheduleAppointmentReminder(updated);
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
    } finally {
      setIsUpdating(false);
    }
  };

  if (!visible || !appointment) return null;

  const statuses: AppointmentStatus[] = [
    "PLANIFIE",
    "CONFIRME",
    "REALISE",
    "ANNULE",
    "REPORTE",
  ];

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
          {statuses.map((s) => (
            <Pressable
              key={s}
              onPress={() => handleUpdateStatus(s)}
              disabled={isUpdating || s === appointment.status}
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

export function MissionRdvTab({ missionId, isArchived }: MissionRdvTabProps) {
  const theme = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadAppointments = useCallback(async () => {
    setError(null);
    try {
      const result = await getMissionAppointments(missionId);
      const sorted = [...result].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      setAppointments(sorted);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible de charger les rendez-vous";
      setError(msg);
    }
  }, [missionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        await loadAppointments();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAppointments]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadAppointments();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAppointments]);

  const handleStatusUpdated = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
  };

  if (isLoading) {
    return (
      <View className="py-four items-center">
        <ThemedText themeColor="textSecondary">Chargement...</ThemedText>
      </View>
    );
  }
  if (error) {
    return (
      <ThemedText themeColor="danger" className="text-center py-four">
        {error}
      </ThemedText>
    );
  }

  if (appointments.length === 0) {
    return (
      <View className="items-center py-six">
        <Ionicons
          name="calendar-outline"
          color={theme.textSecondary}
          size={32}
        />
        <ThemedText themeColor="textSecondary" className="mt-two text-center">
          Aucun rendez-vous prévu pour cette mission
        </ThemedText>
        {!isArchived && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/missions/appointment-form" as any,
                params: { missionId, mode: "create" },
              })
            }
            className="mt-three flex-row items-center gap-one rounded-three bg-accent px-four py-two"
          >
            <Ionicons name="add" color={theme.background} size={16} />
            <ThemedText type="smallBold" themeColor="background">
              + Planifier un RDV
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <ScrollView
        contentContainerClassName="pb-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="gap-two">
          {appointments.map((item) => (
            <AppointmentRow
              key={item.id}
              appointment={item}
              onPress={() => {
                setSelectedAppointment(item);
                setShowStatusModal(true);
              }}
              onReschedule={() => {
                router.push({
                  pathname: "/missions/appointment-form" as any,
                  params: {
                    missionId,
                    mode: "reschedule",
                    appointmentId: item.id,
                  },
                });
              }}
            />
          ))}
        </View>

        {!isArchived && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/missions/appointment-form" as any,
                params: { missionId, mode: "create" },
              })
            }
            className="mt-three flex-row items-center justify-center gap-one rounded-three bg-accent py-two"
          >
            <Ionicons name="add" color={theme.background} size={16} />
            <ThemedText type="smallBold" themeColor="background">
              + Planifier un RDV
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>

      <StatusEditModal
        appointment={selectedAppointment}
        visible={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedAppointment(null);
        }}
        onStatusUpdated={handleStatusUpdated}
      />
    </GestureHandlerRootView>
  );
}
