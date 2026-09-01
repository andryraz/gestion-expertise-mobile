import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { QuoteCard } from "@/components/missions/quote-card";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { Quote } from "@/types/quote";

type QuoteHistoryProps = {
  quotes: Quote[];
  onViewDocument?: (quote: Quote) => void;
};

export function QuoteHistory({ quotes, onViewDocument }: QuoteHistoryProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (quotes.length === 0) return null;

  return (
    <View className="mt-two">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        hitSlop={8}
        className="flex-row items-center gap-one px-one"
      >
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          color={theme.textSecondary}
          size={14}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Voir l&apos;historique ({quotes.length})
        </ThemedText>
      </Pressable>

      {expanded && (
        <View className="mt-two gap-two">
          {quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onViewDocument={onViewDocument}
            />
          ))}
        </View>
      )}
    </View>
  );
}
