import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "react-native";

type LogoMarkProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function LogoMark({
  title = "BâtiExpert",
  subtitle = "Ingénierie & Expertise",
  compact = false,
}: LogoMarkProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View
        style={[
          styles.badge,
          { backgroundColor: theme.text },
          compact && styles.badgeCompact,
        ]}
      >
        {/* <SymbolView
          tintColor={theme.background}
          name={{ ios: "shield.fill", web: "shield.fill" } as any}
          size={compact ? 18 : 22}
          weight="bold"
        /> */}
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: compact ? 30 : 36, height: compact ? 30 : 36 }}
          resizeMode="contain"
        />
      </View>
      <View style={styles.textGroup}>
        <ThemedText
          type={compact ? "smallBold" : "default"}
          style={styles.title}
        >
          {title}
        </ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  rowCompact: {
    gap: Spacing.two,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCompact: {
    width: 36,
    height: 36,
    borderRadius: Spacing.one + 2,
  },
  textGroup: {
    gap: 2,
  },
  title: {
    fontWeight: "700",
  },
});
