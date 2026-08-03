import {
    TabList,
    Tabs,
    TabSlot,
    TabTrigger,
    TabTriggerSlotProps,
} from "expo-router/ui";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const TABS = [
  {
    name: "dashboard",
    href: "/(tabs)/dashboard",
    label: "Dashboard",
    icon: "square.grid.2x2.fill",
  },
  {
    name: "missions",
    href: "/(tabs)/missions",
    label: "Missions",
    icon: "doc.text.fill",
  },
  {
    name: "calendar",
    href: "/(tabs)/calendar",
    label: "Calendar",
    icon: "calendar",
  },
  {
    name: "settings",
    href: "/(tabs)/settings",
    label: "Settings",
    icon: "gearshape.fill",
  },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <View
          style={StyleSheet.flatten([
            styles.tabList,
            { paddingBottom: insets.bottom || Spacing.two },
          ])}
        >
          {TABS.map((tab) => (
            <TabTrigger
              key={tab.name}
              name={tab.name}
              href={tab.href as any}
              asChild
            >
              <TabButton label={tab.label} icon={tab.icon} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  label,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { label: string; icon: string }) {
  const theme = useTheme();
  return (
    <Pressable {...props} style={styles.tabItem}>
      <ThemedView
        type={isFocused ? "backgroundSelected" : undefined}
        style={styles.tabButtonInner}
      >
        <SymbolView
          tintColor={isFocused ? theme.text : theme.textSecondary}
          name={{ ios: icon, web: icon } as any}
          size={18}
        />
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
          numberOfLines={1} // 👈 empêche le retour à la ligne
          style={styles.tabLabel}
        >
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  tabItem: {
    flex: 1,
    flexShrink: 1, // 👈 ajouté
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  tabButtonInner: {
    alignItems: "center",
    gap: 2,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one, // 👈 était Spacing.three (16), passe à Spacing.one (4)
    borderRadius: Spacing.two,
    minWidth: 56, // 👈 réduit un peu aussi (était 64)
  },
});
