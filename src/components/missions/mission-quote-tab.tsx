import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AcceptedQuoteState } from "@/components/missions/quote-accepted";
import { AwaitingQuoteState } from "@/components/missions/quote-awaiting";
import { EmptyQuoteState } from "@/components/missions/quote-empty";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissionQuotes } from "@/services/quote-services";
import type { Mission } from "@/types/mission";
import type { Quote } from "@/types/quote";

type MissionDevisTabProps = {
  mission: Mission;
  isArchived: boolean;
  onMissionChanged?: () => void;
};

export function MissionDevisTab({
  mission,
  isArchived,
  onMissionChanged,
}: MissionDevisTabProps) {
  const theme = useTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    setError(null);
    try {
      const result = await getMissionQuotes(mission.id);
      setQuotes(result);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible de charger les devis";
      setError(msg);
    }
  }, [mission.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        await loadQuotes();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadQuotes]);

  const handleQuoteRefresh = useCallback(() => {
    loadQuotes();
  }, [loadQuotes]);

  if (isLoading) {
    return (
      <View className="py-four items-center">
        <ActivityIndicator color={theme.accent} />
        <ThemedText themeColor="textSecondary" className="mt-two">
          Chargement des devis...
        </ThemedText>
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

  const activeQuote = quotes.find(
    (q) =>
      q.status === "BROUILLON" ||
      q.status === "ENVOYE" ||
      q.status === "ACCEPTE",
  );
  const historyQuotes = quotes.filter(
    (q) => q.status === "REMPLACE" || q.status === "REFUSE",
  );

  if (!activeQuote) {
    return (
      <EmptyQuoteState
        missionId={mission.id}
        isArchived={isArchived}
        onQuoteCreated={handleQuoteRefresh}
      />
    );
  }

  if (activeQuote.status === "ACCEPTE") {
    return (
      <AcceptedQuoteState
        activeQuote={activeQuote}
        historyQuotes={historyQuotes}
      />
    );
  }

  return (
    <AwaitingQuoteState
      activeQuote={activeQuote}
      historyQuotes={historyQuotes}
      missionId={mission.id}
      isArchived={isArchived}
      onRefresh={handleQuoteRefresh}
      onMissionChanged={onMissionChanged ?? (() => {})}
    />
  );
}
