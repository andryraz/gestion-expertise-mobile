import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppointmentCard } from "@/components/calendar/appointment-card";
import { MonthGrid } from "@/components/calendar/month-grid";
import { EmptyState } from "@/components/dashboard";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LogoMark } from "@/components/ui/logo-mark";
import { useTheme } from "@/hooks/use-theme";
import { useAppointmentsRange } from "@/queries/appointments";
import { ApiError } from "@/services/api-client";
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
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const from = startOfMonth(visibleMonth).toISOString();
  const to = endOfMonth(visibleMonth).toISOString();

  const {
    data: rawAppointments,
    isLoading,
    error: queryError,
    refetch,
  } = useAppointmentsRange(from, to);

  const appointments = [...(rawAppointments ?? [])].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger le calendrier"
    : null;

  // React Query v5 n'a plus de callbacks onSuccess/onError : on journalise
  // via un effet.
  useEffect(() => {
    if (rawAppointments) {
      logger.info("Calendar", "Chargement réussi", {
        count: rawAppointments.length,
      });
    }
  }, [rawAppointments]);
  useEffect(() => {
    if (error) logger.error("Calendar", "Échec du chargement", error);
  }, [error]);

  // État dédié au pull-to-refresh manuel — voir missions.tsx pour
  // l'explication (isRefetching de React Query réagit aussi aux
  // resynchronisations silencieuses déclenchées ailleurs).
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
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
            <Pressable
              onPress={() => changeMonth(-1)}
              hitSlop={8}
              className="p-one"
            >
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
            <Pressable
              onPress={() => changeMonth(1)}
              hitSlop={8}
              className="p-one"
            >
              <Ionicons name="chevron-forward" color={theme.text} size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="gap-three w-full max-w-content self-center px-four pb-six"
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={handleRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {isLoading && (
              <ThemedText themeColor="textSecondary">Chargement...</ThemedText>
            )}

            {error && !isLoading && (
              <ThemedText themeColor="danger">{error}</ThemedText>
            )}

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
                          onPress={() =>
                            router.push(
                              `/missions/${appointment.missionId}` as any,
                            )
                          }
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
