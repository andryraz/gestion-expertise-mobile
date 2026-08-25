import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  formatAmount,
  QUOTE_STATUS_BG,
  QUOTE_STATUS_FG,
  QUOTE_STATUS_LABELS,
} from "@/constants/quote-labels";
import { formatQuoteDateTime } from "@/utils/format-quote-date";
import type { Quote } from "@/types/quote";

type QuoteCardProps = {
  quote: Quote;
  isExpert: boolean;
};

export function QuoteCard({ quote, isExpert }: QuoteCardProps) {
  return (
    <ThemedView
      type="backgroundElement"
      className={[
        "rounded-three border border-border dark:border-border-dark px-three py-three",
        isExpert ? "mr-six" : "ml-six",
      ].join(" ")}
    >
      <View className="flex-row items-center justify-between mb-one">
        <View className="flex-row items-center gap-two">
          <ThemedText type="smallBold">V{quote.version}</ThemedText>
          <View
            className={`rounded-five px-two py-half ${QUOTE_STATUS_BG[quote.status]}`}
          >
            <ThemedText
              type="eyebrow"
              className={QUOTE_STATUS_FG[quote.status]}
            >
              {QUOTE_STATUS_LABELS[quote.status]}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatQuoteDateTime(quote.sentAt)}
        </ThemedText>
      </View>

      <View className="flex-row items-center justify-between">
        <ThemedText
          type="subtitle"
          themeColor="accent"
          className="text-[28px] leading-[32px]"
        >
          {formatAmount(quote.amount, quote.currency)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isExpert ? "Expert" : "Client"}
        </ThemedText>
      </View>

      {quote.description ? (
        <ThemedText type="small" themeColor="textSecondary" className="mt-one">
          {quote.description}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}
