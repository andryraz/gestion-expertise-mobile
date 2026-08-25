import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { formatQuoteDateTime } from "@/utils/format-quote-date";
import type { Quote } from "@/types/quote";
import { QuoteCard } from "@/components/missions/quote-card";
import { EmptyQuoteState } from "@/components/missions/quote-empty";

type RefusedQuoteStateProps = {
  quotes: Quote[];
  missionId: string;
  isArchived: boolean;
  onQuoteCreated: (quote: Quote) => void;
};

export function RefusedQuoteState({
  quotes,
  missionId,
  isArchived,
  onQuoteCreated,
}: RefusedQuoteStateProps) {
  const theme = useTheme();
  const sorted = [...quotes].sort((a, b) => b.version - a.version);
  const refused = sorted[0];

  return (
    <View className="gap-three">
      <ThemedView
        type="backgroundElement"
        className="rounded-three border border-border dark:border-border-dark p-four items-center"
      >
        <Ionicons
          name="close-circle"
          color={theme.textSecondary}
          size={28}
        />
        <ThemedText
          type="smallBold"
          themeColor="textSecondary"
          className="mt-two"
        >
          Devis refusé
        </ThemedText>
        {refused?.respondedAt && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-one"
          >
            Refusé le {formatQuoteDateTime(refused.respondedAt)}
          </ThemedText>
        )}
      </ThemedView>

      {sorted.length > 0 && (
        <View>
          <ThemedText
            type="eyebrow"
            themeColor="textSecondary"
            className="mb-two px-one"
          >
            Historique
          </ThemedText>
          <View className="gap-two">
            {sorted.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                isExpert={q.proposedBy === "EXPERT"}
              />
            ))}
          </View>
        </View>
      )}

      {!isArchived && (
        <EmptyQuoteState
          missionId={missionId}
          isArchived={isArchived}
          onQuoteCreated={onQuoteCreated}
        />
      )}
    </View>
  );
}
