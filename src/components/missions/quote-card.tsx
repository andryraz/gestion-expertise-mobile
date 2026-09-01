import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  formatAmount,
  QUOTE_STATUS_BG,
  QUOTE_STATUS_FG,
  QUOTE_STATUS_LABELS,
} from "@/constants/quote-labels";
import type { Quote } from "@/types/quote";
import { useTheme } from "@/hooks/use-theme";
import { formatQuoteDate } from "@/utils/format-quote-date";

type QuoteCardProps = {
  quote: Quote;
  onViewDocument?: (quote: Quote) => void;
};

export function QuoteCard({ quote, onViewDocument }: QuoteCardProps) {
  const theme = useTheme();
  const hasDocument = !!quote.documentPath;

  return (
    <ThemedView
      type="backgroundElement"
      className="rounded-three border border-border dark:border-border-dark px-three py-three"
    >
      {/* ── Header: amount + status ── */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-two">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
            <Ionicons name="document-text" color={undefined} size={14} />
          </View>
          <ThemedText type="smallBold">
            {formatAmount(quote.amount, quote.currency)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            v{quote.version}
          </ThemedText>
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
      </View>

      {/* ── Separator ── */}
      <View className="my-two ml-10 border-b border-border dark:border-border-dark" />

      {/* ── Creation date ── */}
      <ThemedText
        type="small"
        themeColor="textSecondary"
        className="ml-10"
      >
        Créé le {formatQuoteDate(quote.createdAt)}
      </ThemedText>

      {/* ── Document link ── */}
      {hasDocument && (
        <Pressable
          onPress={() => onViewDocument?.(quote)}
          disabled={!onViewDocument}
          className="flex-row items-center gap-one mt-two ml-10"
        >
          <Ionicons
            name="document-attach"
            color={onViewDocument ? theme.accent : theme.textSecondary}
            size={13}
          />
          <ThemedText
            type="small"
            themeColor={onViewDocument ? "accent" : "textSecondary"}
            numberOfLines={1}
            className={`flex-1 ${onViewDocument ? "underline" : ""}`}
          >
            {quote.documentFileName ?? "Voir le document"}
          </ThemedText>
          {onViewDocument && (
            <Ionicons
              name="eye-outline"
              color={theme.accent}
              size={13}
            />
          )}
        </Pressable>
      )}
    </ThemedView>
  );
}
