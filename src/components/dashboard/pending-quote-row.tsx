import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PendingQuoteRowProps = {
  reference: string;
  title: string;
};

export function PendingQuoteRow({ reference, title }: PendingQuoteRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        RÉF: {reference}
      </ThemedText>
      <ThemedText type="smallBold" numberOfLines={2}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: 2,
  },
});
