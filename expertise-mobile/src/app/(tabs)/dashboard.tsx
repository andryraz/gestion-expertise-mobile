import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogoMark } from "@/components/auth";
import {
    MissionsTable,
    PendingQuoteRow,
    QuickActionBanner,
    SectionCard,
    StatsGrid,
    StatTile,
} from "@/components/dashboard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { STATUS_LABELS } from "@/constants/mission-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissions, getMissionsStats } from "@/services/mission-services";
import { Mission, MissionsStats } from "@/types/mission";
import { logger } from "@/utils/logger";

export default function DashboardScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<MissionsStats | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const [statsResult, missionsResult] = await Promise.all([
        getMissionsStats(),
        getMissions({
          archived: false,
          sortBy: "updatedAt",
          sortOrder: "desc",
          limit: 5,
        }),
      ]);
      setStats(statsResult);
      setMissions(missionsResult.data);
      logger.info("Dashboard", "Chargement réussi", {
        total: statsResult.total,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de charger le tableau de bord";
      setError(message);
      logger.error("Dashboard", "Échec du chargement", message);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadDashboard().finally(() => setIsLoading(false));
  }, [loadDashboard]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-four py-two">
          <LogoMark compact />
          <Pressable onPress={handleRefresh} hitSlop={8}>
            <SymbolView
              tintColor={theme.text}
              name={
                {
                  ios: "arrow.trianglehead.2.clockwise",
                  web: "arrow.trianglehead.2.clockwise",
                } as any
              }
              size={18}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="gap-three self-center w-full max-w-content px-four pb-six"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-two gap-one">
            <ThemedText type="subtitle">Vue d'ensemble des missions</ThemedText>
            {/* <ThemedText themeColor="textSecondary">
              Suivi global des projets d'ingénierie en cours
            </ThemedText> */}
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
                  icon="doc.badge.ellipsis"
                  title="Devis en attente de réponse"
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

              <SectionCard title="Missions recents">
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
      </SafeAreaView>
    </ThemedView>
  );
}
