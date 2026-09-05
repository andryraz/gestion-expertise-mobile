import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MissionsTable,
  PendingQuoteRow,
  QuickActionBanner,
  SectionCard,
  StatsGrid,
  StatTile,
} from "@/components/dashboard";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LogoMark } from "@/components/ui/logo-mark";
import { STATUS_LABELS } from "@/constants/mission-labels";
import { useTheme } from "@/hooks/use-theme";
import { useDashboardMissions } from "@/queries/missions";
import { ApiError } from "@/services/api-client";
import { logger } from "@/utils/logger";

export default function DashboardScreen() {
  const theme = useTheme();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useDashboardMissions();

  // Même raison que dans missions.tsx : isolé de isRefetching pour ne pas
  // faire réapparaître le spinner de pull-to-refresh lors d'une
  // resynchronisation silencieuse déclenchée ailleurs.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  };

  const stats = data?.stats ?? null;
  const missions = data?.missions ?? [];
  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger le tableau de bord"
    : null;

  // React Query v5 n'a plus de callbacks onSuccess/onError sur useQuery :
  // on journalise via un effet, déclenché à chaque changement de data/error.
  useEffect(() => {
    if (data) {
      logger.info("Dashboard", "Load successful", { total: data.stats.total });
    }
  }, [data]);
  useEffect(() => {
    if (error) logger.error("Dashboard", "Load failed", error);
  }, [error]);

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

          <ScrollView
            contentContainerClassName="gap-three self-center w-full max-w-content px-four pb-six"
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={handleRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-two gap-one justify-between">
              <ThemedText type="subtitle" themeColor="accent">
                Vue d'ensemble des missions
              </ThemedText>
            </View>

            {isLoading && (
              <ThemedText themeColor="textSecondary">Chargement...</ThemedText>
            )}

            {error && !isLoading && (
              <ThemedText themeColor="danger">{error}</ThemedText>
            )}

            {stats && !isLoading && (
              <>
                <StatsGrid>
                  {stats.byStatus.map((entry) => (
                    <StatTile
                      key={entry.status}
                      label={STATUS_LABELS[entry.status]}
                      value={entry.count}
                    />
                  ))}
                  <StatTile
                    label="En retard"
                    value={stats.overdue.count}
                    valueColor={
                      stats.overdue.count > 0 ? theme.danger : undefined
                    }
                  />
                  <StatTile label="Archivées" value={stats.archived.count} />
                </StatsGrid>

                {stats.pendingClientResponse.count > 0 && (
                  <SectionCard
                    icon="document-text-outline"
                    title="Devis en attente de réponse"
                    accent
                  >
                    {stats.pendingClientResponse.missions.map((mission) => (
                      <PendingQuoteRow
                        key={mission.id}
                        reference={mission.reference}
                        title={mission.title}
                      />
                    ))}
                  </SectionCard>
                )}

                <QuickActionBanner
                  eyebrow="Action rapide"
                  title="Créer une nouvelle mission d'expertise"
                  actionLabel="Nouvelle mission"
                  onPress={() => router.push("/missions/new" as any)}
                />

                <SectionCard title="Missions récentes">
                  <MissionsTable
                    missions={missions}
                    onPressMission={(mission) =>
                      router.push(`/missions/${mission.id}` as any)
                    }
                  />
                </SectionCard>
              </>
            )}
          </ScrollView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
