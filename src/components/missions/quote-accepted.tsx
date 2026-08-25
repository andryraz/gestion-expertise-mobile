import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { formatAmount } from "@/constants/quote-labels";
import { formatQuoteDateTime } from "@/utils/format-quote-date";
import type { Quote } from "@/types/quote";
import { QuoteCard } from "@/components/missions/quote-card";

type AcceptedQuoteStateProps = {
  quotes: Quote[];
};

export function AcceptedQuoteState({ quotes }: AcceptedQuoteStateProps) {
  const sorted = [...quotes].sort((a, b) => b.version - a.version);
  const accepted = sorted[0];

  return (
    <View className="gap-three">
      <ThemedView
        type="backgroundElement"
        className="rounded-three border-2 border-success dark:border-success-dark p-four items-center"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-success dark:bg-success-dark mb-two">
          <Ionicons name="checkmark" color="#fff" size={24} />
        </View>
        <ThemedText type="eyebrow" themeColor="success" className="mb-one">
          Devis accepté
        </ThemedText>
        <ThemedText
          type="subtitle"
          themeColor="success"
          className="text-[36px] leading-[40px]"
        >
          {accepted ? formatAmount(accepted.amount, accepted.currency) : "—"}
        </ThemedText>
        {accepted?.respondedAt && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-one"
          >
            Accepté le {formatQuoteDateTime(accepted.respondedAt)}
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
    </View>
  );
}
