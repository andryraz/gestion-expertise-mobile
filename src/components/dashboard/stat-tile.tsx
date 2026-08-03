import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type StatTileProps = {
  label: string;
  value: number;
  valueColor?: string;
};

export function StatTile({ label, value, valueColor }: StatTileProps) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { borderColor: theme.border }]}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.value, valueColor ? { color: valueColor } : undefined]}
      >
        {String(value).padStart(2, "0")}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  value: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
});
