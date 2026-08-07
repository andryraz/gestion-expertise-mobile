import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/auth';
import { EmptyState } from '@/components/dashboard';
import { MissionCard, MissionSearchBar, StatusFilterChips, type StatusFilterValue } from '@/components/missions';
import { ScreenFade } from '@/components/screen-fade';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/services/api-client';
import { getMissions } from '@/services/mission-services';
import { Mission } from '@/types/mission';
import { logger } from '@/utils/logger';

const PAGE_SIZE = 20;

export default function MissionsScreen() {
  const theme = useTheme();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');

  const [missions, setMissions] = useState<Mission[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  const fetchMissions = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      const currentRequest = ++requestId.current;
      setError(null);

      try {
        const result = await getMissions({
          search: debouncedSearch.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          archived: false,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: targetPage,
          limit: PAGE_SIZE,
        });

        if (currentRequest !== requestId.current) return;

        setMissions((prev) => (mode === 'append' ? [...prev, ...result.data] : result.data));
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
        logger.info('Missions', 'Chargement réussi', { page: result.meta.page, total: result.meta.total });
      } catch (err) {
        if (currentRequest !== requestId.current) return;
        const message = err instanceof ApiError ? err.message : 'Impossible de charger les missions';
        setError(message);
        logger.error('Missions', 'Échec du chargement', message);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    setIsLoading(true);
    fetchMissions(1, 'replace').finally(() => setIsLoading(false));
  }, [fetchMissions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMissions(1, 'replace');
    setIsRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || isLoading || page >= totalPages) return;
    setIsLoadingMore(true);
    await fetchMissions(page + 1, 'append');
    setIsLoadingMore(false);
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
                <MissionCard mission={item} />
              </View>
            )}
            ItemSeparatorComponent={() => <View className="h-two" />}
            ListHeaderComponent={
              <View className="mb-three gap-three">
                <View className="w-full max-w-content gap-three self-center px-four">
                  <ThemedText type="subtitle" themeColor="accent">
                    Missions
                  </ThemedText>
                  <MissionSearchBar value={searchInput} onChangeText={setSearchInput} />
                </View>
                <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ThemedText themeColor="textSecondary" type="small" className="py-three text-center">
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
                      icon="document-text-outline"
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
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            contentContainerClassName="pb-six"
            showsVerticalScrollIndicator={false}
          />
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
