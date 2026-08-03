import { SymbolView } from "expo-symbols";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SectionCardProps = {
  icon?: string;
  title: string;
  children: ReactNode;
};

export function SectionCard({ icon, title, children }: SectionCardProps) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        {icon && (
          <SymbolView
            tintColor={theme.text}
            name={{ ios: icon, web: icon } as any}
            size={16}
          />
        )}
        <ThemedText type="eyebrow">{title}</ThemedText>
      </View>
      <View style={styles.body}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  body: {
    gap: Spacing.two,
  },
});
