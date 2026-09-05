import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useMissionAppointments } from "@/queries/appointments";
import { ApiError } from "@/services/api-client";
import { type Appointment } from "@/types/appointment";
import { logger } from "@/utils/logger";

import { AppointmentRow } from "./appointment-row";
import { StatusEditModal } from "./status-edit-modal";

type MissionAppointmentTabProps = {
  missionId: string;
  isArchived: boolean;
};

export function MissionAppointmentTab({
  missionId,
  isArchived,
}: MissionAppointmentTabProps) {
  const theme = useTheme();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const {
    data: rawAppointments,
    isLoading,
    error: queryError,
    refetch,
  } = useMissionAppointments(missionId);

  const appointments = [...(rawAppointments ?? [])].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger les rendez-vous"
    : null;

  useEffect(() => {
    if (error) {
      logger.error("RDV mission", "Échec du chargement", { missionId, error });
    }
  }, [error, missionId]);

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  };

  const handleStatusUpdated = (_updated: Appointment) => {
    // La mutation de status-edit-modal.tsx invalide déjà ["appointments"],
    // ce qui refetch automatiquement cette liste. Rien d'autre à faire ici.
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
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handleRefresh}
          />
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
