import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogoMark } from "@/components/auth";
import { AppointmentCard } from "@/components/calendar/appointment-card";
import { MonthGrid } from "@/components/calendar/month-grid";
import { EmptyState } from "@/components/dashboard";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getAppointments } from "@/services/appointment-services";
import { getOwnedMissionIds } from "@/services/mission-services";
import { Appointment } from "@/types/appointment";
import {
  addMonths,
  endOfMonth,
  formatDayHeading,
  formatMonthLabel,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "@/utils/calendar-date";
import { logger } from "@/utils/logger";

export default function CalendarScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpert = user?.role === "EXPERT";

  const loadAppointments = useCallback(async () => {
    setError(null);
    try {
      const from = startOfMonth(visibleMonth).toISOString();
      const to = endOfMonth(visibleMonth).toISOString();

      // Le endpoint GET /appointments ne filtre pas par expert côté serveur :
      // pour un compte EXPERT on vérifie ici que chaque rendez-vous appartient
      // bien à une de ses missions avant de l'afficher. Un ADMIN voit tout.
      let ownedMissionIds: Set<string> | null = null;
      if (isExpert) {
        try {
          ownedMissionIds = await getOwnedMissionIds(user.id);
        } catch (err) {
          // Sans la liste des missions on ne peut pas vérifier l'appartenance :
          // on refuse d'afficher des rendez-vous potentiellement étrangers.
          setAppointments([]);
          setError(
            "Impossible de vérifier tes missions. Aucun rendez-vous n'est affiché pour le moment.",
          );
          logger.error(
            "Calendar",
            "Impossible de charger les missions de l'expert connecté",
            err instanceof Error ? err.message : err,
          );
          return;
        }
      }

      const result = await getAppointments(from, to);

      // Le backend ne garantit pas explicitement l'ordre : on trie ici pour
      // que l'affichage des rendez-vous du jour sélectionné soit chronologique.
      let sorted = [...result].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );

      if (ownedMissionIds) {
        const filtered = sorted.filter((appointment) =>
          ownedMissionIds.has(appointment.missionId),
        );
        if (filtered.length !== sorted.length) {
          const hidden = sorted.filter(
            (appointment) => !ownedMissionIds.has(appointment.missionId),
          );
          logger.warn(
            "Calendar",
            "Le backend a renvoyé des rendez-vous hors des missions de l'expert connecté — masqués côté client",
            { hidden: hidden.length, ids: hidden.map((appointment) => appointment.id) },
          );
        }
        sorted = filtered;
      }

      setAppointments(sorted);
      logger.info("Calendar", "Chargement réussi", { count: sorted.length });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Impossible de charger le calendrier";
      setError(message);
      logger.error("Calendar", "Échec du chargement", message);
    }
  }, [visibleMonth, isExpert, user]);

  useEffect(() => {
    setIsLoading(true);
    loadAppointments().finally(() => setIsLoading(false));
  }, [loadAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(visibleMonth, delta);
    setVisibleMonth(next);
    if (!isSameMonth(selectedDate, next)) {
      setSelectedDate(startOfMonth(next));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setVisibleMonth(startOfMonth(today));
    setSelectedDate(today);
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    if (!isSameMonth(day, visibleMonth)) {
      setVisibleMonth(startOfMonth(day));
    }
  };

  const selectedItems = appointments.filter((appointment) =>
    isSameDay(new Date(appointment.scheduledAt), selectedDate),
  );

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <View className="flex-row items-center justify-between px-four py-two">
            <LogoMark compact />
            <Pressable onPress={handleRefresh} hitSlop={8}>
              <Ionicons name="refresh" color={theme.accent} size={20} />
            </Pressable>
          </View>

          <View className="w-full max-w-content self-center px-four pb-three">
            <ThemedText type="subtitle" themeColor="accent">
              Calendrier
            </ThemedText>
          </View>

          <View className="w-full max-w-content flex-row items-center justify-between self-center px-four pb-three">
            <Pressable onPress={() => changeMonth(-1)} hitSlop={8} className="p-one">
              <Ionicons name="chevron-back" color={theme.text} size={20} />
            </Pressable>
            <Pressable
              onPress={goToToday}
              hitSlop={8}
              className="rounded-five bg-background-element px-three py-one dark:bg-background-element-dark"
            >
              <ThemedText type="smallBold" className="text-base">
                {formatMonthLabel(visibleMonth)}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => changeMonth(1)} hitSlop={8} className="p-one">
              <Ionicons name="chevron-forward" color={theme.text} size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="gap-three w-full max-w-content self-center px-four pb-six"
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && <ThemedText themeColor="textSecondary">Chargement...</ThemedText>}

            {error && !isLoading && <ThemedText themeColor="danger">{error}</ThemedText>}

            {!isLoading && !error && (
              <>
                <MonthGrid
                  month={visibleMonth}
                  appointments={appointments}
                  selectedDate={selectedDate}
                  onSelectDay={handleSelectDay}
                />

                {appointments.length === 0 ? (
                  <EmptyState
                    icon="calendar-outline"
                    title="Aucun rendez-vous ce mois-ci"
                    description="Les rendez-vous planifiés sur tes missions apparaîtront directement sur les dates du calendrier."
                    badge={formatMonthLabel(visibleMonth)}
                  />
                ) : (
                  <View className="gap-two">
                    <ThemedText type="eyebrow" themeColor="textSecondary">
                      {formatDayHeading(selectedDate)}
                    </ThemedText>
                    {selectedItems.length > 0 ? (
                      selectedItems.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onPress={() => router.push(`/missions/${appointment.missionId}` as any)}
                        />
                      ))
                    ) : (
                      <ThemedText type="small" themeColor="textSecondary">
                        Aucun rendez-vous ce jour-là.
                      </ThemedText>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
