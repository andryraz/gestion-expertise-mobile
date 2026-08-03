import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  badge?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  badge = "Bientôt disponible",
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconBadge, { backgroundColor: theme.backgroundElement }]}
      >
        <SymbolView
          tintColor={theme.textSecondary}
          name={{ ios: icon, web: icon } as any}
          size={28}
        />
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.description}>
        {description}
      </ThemedText>
      <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {badge}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.one,
  },
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 20,
  },
  pill: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
});
