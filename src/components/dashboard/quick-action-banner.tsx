import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type QuickActionBannerProps = {
  eyebrow: string;
  title: string;
  actionLabel: string;
  onPress: () => void;
};

export function QuickActionBanner({
  eyebrow,
  title,
  actionLabel,
  onPress,
}: QuickActionBannerProps) {
  const theme = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: theme.text }]}>
      <ThemedText
        type="eyebrow"
        style={{ color: theme.background, opacity: 0.7 }}
      >
        {eyebrow}
      </ThemedText>
      <ThemedText style={[styles.title, { color: theme.background }]}>
        {title}
      </ThemedText>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: theme.background, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <SymbolView
          tintColor={theme.text}
          name={{ ios: "plus", web: "plus" } as any}
          size={14}
          weight="bold"
        />
        <ThemedText type="smallBold">{actionLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
