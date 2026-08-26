import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  formatAmount,
  QUOTE_STATUS_BG,
  QUOTE_STATUS_FG,
  QUOTE_STATUS_LABELS,
} from "@/constants/quote-labels";
import { useTheme } from "@/hooks/use-theme";
import { formatQuoteDateTime } from "@/utils/format-quote-date";
import type { Quote } from "@/types/quote";

type QuoteCardProps = {
  quote: Quote;
  isExpert: boolean;
};

export function QuoteCard({ quote, isExpert }: QuoteCardProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
        <Ionicons
          name={isExpert ? "person" : "people"}
          color={theme.accent}
          size={18}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-two">
          <ThemedText type="smallBold">
            {formatAmount(quote.amount, quote.currency)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            V{quote.version}
          </ThemedText>
        </View>
        <View className="flex-row items-center gap-one mt-half">
          <ThemedText type="small" themeColor="textSecondary">
            {isExpert ? "Expert" : "Client"}
          </ThemedText>
          {quote.sentAt && (
            <>
              <ThemedText type="small" themeColor="textSecondary">·</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatQuoteDateTime(quote.sentAt)}
              </ThemedText>
            </>
          )}
        </View>
        {quote.description ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            numberOfLines={1}
            className="mt-half"
          >
            {quote.description}
          </ThemedText>
        ) : null}
      </View>

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
    </ThemedView>
  );
}
