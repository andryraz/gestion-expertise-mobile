import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { QuoteHistory } from "@/components/missions/quotes/quote-history";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { formatAmount } from "@/constants/quote-labels";
import type { Quote } from "@/types/quote";
import { formatQuoteDateTime } from "@/utils/format-quote-date";

type AcceptedQuoteStateProps = {
  activeQuote: Quote;
  historyQuotes: Quote[];
  onViewDocument?: (quote: Quote) => void;
};

export function AcceptedQuoteState({
  activeQuote,
  historyQuotes,
  onViewDocument,
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
        <ThemedText type="small" themeColor="textSecondary" className="mt-one">
          Créé le {formatQuoteDateTime(activeQuote.createdAt)}
        </ThemedText>
        {activeQuote.sentAt && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-half"
          >
            Envoyé le {formatQuoteDateTime(activeQuote.sentAt)}
          </ThemedText>
        )}
        {activeQuote.acceptedAt && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-half"
          >
            Accepté le {formatQuoteDateTime(activeQuote.acceptedAt)}
          </ThemedText>
        )}
      </ThemedView>

      <QuoteHistory quotes={historyQuotes} onViewDocument={onViewDocument} />
    </View>
  );
}
