import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogoMark } from "@/components/auth";
import { AppointmentCard } from "@/components/calendar/appointment-card";
import { EmptyState } from "@/components/dashboard";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getAppointments } from "@/services/appointment-services";
import { Appointment } from "@/types/appointment";
import {
  addMonths,
  endOfMonth,
  formatDayHeading,
  formatMonthLabel,
  groupByDay,
  startOfMonth,
} from "@/utils/calendar-date";
import { logger } from "@/utils/logger";

export default function CalendarScreen() {
  const theme = useTheme();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setError(null);
    try {
      const from = startOfMonth(visibleMonth).toISOString();
      const to = endOfMonth(visibleMonth).toISOString();
      const result = await getAppointments(from, to);
      // Le backend ne garantit pas explicitement l'ordre : on trie ici pour
      // que le regroupement par jour (groupByDay) soit fiable.
      const sorted = [...result].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      setAppointments(sorted);
      logger.info("Calendar", "Chargement réussi", { count: sorted.length });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Impossible de charger le calendrier";
      setError(message);
      logger.error("Calendar", "Échec du chargement", message);
    }
  }, [visibleMonth]);

  useEffect(() => {
    setIsLoading(true);
    loadAppointments().finally(() => setIsLoading(false));
  }, [loadAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const changeMonth = (delta: number) => setVisibleMonth((current) => addMonths(current, delta));

  const groups = groupByDay(appointments);

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
            <ThemedText type="smallBold" className="text-base">
              {formatMonthLabel(visibleMonth)}
            </ThemedText>
            <Pressable onPress={() => changeMonth(1)} hitSlop={8} className="p-one">
              <Ionicons name="chevron-forward" color={theme.text} size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="gap-three w-full max-w-content self-center px-four pb-six"
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && (
              <ThemedText themeColor="textSecondary">Chargement...</ThemedText>
            )}

            {error && !isLoading && <ThemedText themeColor="danger">{error}</ThemedText>}

            {!isLoading && !error && groups.length === 0 && (
              <EmptyState
                icon="calendar-outline"
                title="Aucun rendez-vous ce mois-ci"
                description="Les rendez-vous planifiés sur tes missions apparaîtront ici, triés par jour."
                badge={formatMonthLabel(visibleMonth)}
              />
            )}

            {!isLoading &&
              !error &&
              groups.map((group) => (
                <View key={group.day.toISOString()} className="gap-two">
                  <ThemedText type="eyebrow" themeColor="textSecondary">
                    {formatDayHeading(group.day)}
                  </ThemedText>
                  <View className="gap-two">
                    {group.items.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onPress={() => router.push(`/missions/${appointment.missionId}` as any)}
                      />
                    ))}
                  </View>
                </View>
              ))}
          </ScrollView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
