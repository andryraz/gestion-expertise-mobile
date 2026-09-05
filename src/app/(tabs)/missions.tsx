import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/dashboard";
import {
  MissionCard,
  MissionSearchBar,
  StatusFilterChips,
  type StatusFilterValue,
} from "@/components/missions";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LogoMark } from "@/components/ui/logo-mark";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTheme } from "@/hooks/use-theme";
import { useMissionsList } from "@/queries/missions";
import { ApiError } from "@/services/api-client";
import { logger } from "@/utils/logger";

export default function MissionsScreen() {
  const theme = useTheme();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: queryError,
  } = useMissionsList({
    search: debouncedSearch.trim(),
    status: statusFilter,
  });

  // État dédié au pull-to-refresh manuel : `isRefetching` de React Query
  // deviendrait vrai aussi pour les resynchronisations silencieuses
  // déclenchées par une invalidation ailleurs (mission créée/modifiée sur
  // un autre écran) — on ne veut PAS que le spinner de pull-to-refresh
  // réapparaisse dans ce cas, seulement sur une action explicite.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  };

  const missions = data?.pages.flatMap((page) => page.data) ?? [];
  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger les missions"
    : null;

  // React Query v5 n'a plus de callbacks onSuccess/onError : on journalise
  // via un effet.
  useEffect(() => {
    const lastPage = data?.pages[data.pages.length - 1];
    if (lastPage) {
      logger.info("Missions", "Chargement réussi", {
        page: lastPage.meta.page,
        total: lastPage.meta.total,
      });
    }
  }, [data]);
  useEffect(() => {
    if (error) logger.error("Missions", "Échec du chargement", error);
  }, [error]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

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

          <FlatList
            data={missions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="w-full max-w-content self-center px-four">
                <MissionCard
                  mission={item}
                  onPress={() => router.push(`/missions/${item.id}` as any)}
                />
              </View>
            )}
            ItemSeparatorComponent={() => <View className="h-two" />}
            ListHeaderComponent={
              <View className="mb-three gap-three">
                <View className="w-full max-w-content gap-three self-center px-four">
                  <ThemedText type="subtitle" themeColor="accent">
                    Missions
                  </ThemedText>
                  <MissionSearchBar
                    value={searchInput}
                    onChangeText={setSearchInput}
                  />
                </View>
                <StatusFilterChips
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ThemedText
                  themeColor="textSecondary"
                  type="small"
                  className="py-three text-center"
                >
                  Chargement...
                </ThemedText>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                error ? (
                  <ThemedText themeColor="danger" className="px-four">
                    {error}
                  </ThemedText>
                ) : (
                  <View className="px-four">
                    <EmptyState
                      icon="search-outline"
                      title="Aucune mission trouvée"
                      description="Essaie une autre recherche ou un autre filtre de statut."
                      badge="0 résultat"
                    />
                  </View>
                )
              ) : (
                <ThemedText themeColor="textSecondary" className="px-four">
                  Chargement...
                </ThemedText>
              )
            }
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            contentContainerClassName="pb-six"
            showsVerticalScrollIndicator={false}
          />

          <Pressable
            onPress={() => router.push("/missions/new" as any)}
            className="absolute bottom-four right-four h-14 w-14 items-center justify-center rounded-five bg-accent active:opacity-85"
            style={{
              elevation: 4,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Ionicons name="add" color={theme.background} size={26} />
          </Pressable>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
