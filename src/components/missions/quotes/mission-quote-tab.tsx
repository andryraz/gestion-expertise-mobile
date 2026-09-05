import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AcceptedQuoteState } from "@/components/missions/quotes/quote-accepted";
import { AwaitingQuoteState } from "@/components/missions/quotes/quote-awaiting";
import { EmptyQuoteState } from "@/components/missions/quotes/quote-empty";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useMissionParties } from "@/queries/parties";
import { ApiError } from "@/services/api-client";
import { getMissionQuotes } from "@/services/quote-services";
import type { Mission } from "@/types/mission";
import type { Quote } from "@/types/quote";
import { viewQuoteDocument } from "@/utils/view-quote-document";

type MissionQuoteTabProps = {
  mission: Mission;
  isArchived: boolean;
  onMissionChanged?: () => void;
};

export function MissionQuoteTab({
  mission,
  isArchived,
  onMissionChanged,
}: MissionQuoteTabProps) {
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

  // Même clé de requête ["parties", missionId] que mission-parties-tab.tsx :
  // partage le cache au lieu de refaire un getMissionParties dédié à
  // chaque fois que l'utilisateur ouvre l'onglet Devis. Si l'onglet
  // Parties a déjà chargé la liste, elle est disponible ici
  // immédiatement — et si un email client est modifié dans l'onglet
  // Parties, il est à jour ici sans refetch.
  const { data: parties = [] } = useMissionParties(mission.id);
  const clientEmails = useMemo(
    () =>
      parties
        .filter((p) => p.role === "CLIENT" && p.email)
        .map((p) => p.email as string),
    [parties],
  );

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
        onViewDocument={viewQuoteDocument}
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
      clientEmails={clientEmails}
    />
  );
}
