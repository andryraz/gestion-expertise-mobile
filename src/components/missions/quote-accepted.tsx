import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { QuoteHistory } from "@/components/missions/quote-history";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { formatAmount } from "@/constants/quote-labels";
import { formatQuoteDateTime } from "@/utils/format-quote-date";
import type { Quote } from "@/types/quote";

type AcceptedQuoteStateProps = {
  activeQuote: Quote;
  historyQuotes: Quote[];
};

export function AcceptedQuoteState({
  activeQuote,
  historyQuotes,
}: AcceptedQuoteStateProps) {
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
          {formatAmount(activeQuote.amount, activeQuote.currency)}
        </ThemedText>
        {activeQuote.acceptedAt && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-one"
          >
            Accepté le {formatQuoteDateTime(activeQuote.acceptedAt)}
          </ThemedText>
        )}
      </ThemedView>

      <QuoteHistory quotes={historyQuotes} />
    </View>
  );
}
