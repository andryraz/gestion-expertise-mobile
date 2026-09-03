import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissionAppointments } from "@/services/appointment-services";
import { type Appointment } from "@/types/appointment";

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
