import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissionQuotes } from "@/services/quote-services";
import type { Mission } from "@/types/mission";
import type { Quote } from "@/types/quote";
import { EmptyQuoteState } from "@/components/missions/quote-empty";
import { AwaitingQuoteState } from "@/components/missions/quote-awaiting";
import { AcceptedQuoteState } from "@/components/missions/quote-accepted";
import { RefusedQuoteState } from "@/components/missions/quote-refused";

type MissionDevisTabProps = {
  mission: Mission;
  isArchived: boolean;
};

export function MissionDevisTab({ mission, isArchived }: MissionDevisTabProps) {
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

  const handleQuoteCreated = (created: Quote) => {
    setQuotes((prev) => [...prev, created]);
  };

  const handleQuoteUpdated = (updated: Quote) => {
    setQuotes((prev) => {
      const idx = prev.findIndex((q) => q.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  };

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

  const sorted = [...quotes].sort((a, b) => b.version - a.version);
  const latest = sorted[0];

  if (!latest) {
    return (
      <EmptyQuoteState
        missionId={mission.id}
        isArchived={isArchived}
        onQuoteCreated={handleQuoteCreated}
      />
    );
  }

  if (latest.status === "ACCEPTE") {
    return <AcceptedQuoteState quotes={quotes} />;
  }

  if (latest.status === "REFUSE") {
    return (
      <RefusedQuoteState
        quotes={quotes}
        missionId={mission.id}
        isArchived={isArchived}
        onQuoteCreated={handleQuoteCreated}
      />
    );
  }

  return (
    <AwaitingQuoteState
      quotes={quotes}
      missionId={mission.id}
      isArchived={isArchived}
      onQuoteUpdated={handleQuoteUpdated}
    />
  );
}
