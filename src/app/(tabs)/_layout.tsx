import { Ionicons } from "@expo/vector-icons";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
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
    icon: "grid" as const,
    iconInactive: "grid-outline" as const,
  },
  {
    name: "missions",
    href: "/(tabs)/missions",
    label: "Missions",
    icon: "document-text" as const,
    iconInactive: "document-text-outline" as const,
  },
  {
    name: "calendar",
    href: "/(tabs)/calendar",
    label: "Calendar",
    icon: "calendar" as const,
    iconInactive: "calendar-outline" as const,
  },
  {
    name: "settings",
    href: "/(tabs)/settings",
    label: "Settings",
    icon: "settings" as const,
    iconInactive: "settings-outline" as const,
  },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <View
          className="flex-row border-t-border px-two pt-two dark:border-t-border-dark"
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            paddingBottom: insets.bottom || Spacing.two,
          }}
        >
          {TABS.map((tab) => (
            <TabTrigger
              key={tab.name}
              name={tab.name}
              href={tab.href as any}
              asChild
            >
              <TabButton
                label={tab.label}
                iconActive={tab.icon}
                iconInactive={tab.iconInactive}
              />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  label,
  iconActive,
  iconInactive,
  isFocused,
  ...props
}: TabTriggerSlotProps & {
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <Pressable {...props} className="flex-1 shrink items-center">
      <ThemedView
        type={isFocused ? "backgroundSelected" : undefined}
        className="min-w-[56px] items-center gap-0.5 rounded-two px-one py-one"
      >
        <Ionicons
          name={isFocused ? iconActive : iconInactive}
          color={isFocused ? theme.accent : theme.textSecondary}
          size={18}
        />
        <ThemedText
          type="small"
          themeColor={isFocused ? "accent" : "textSecondary"}
          numberOfLines={1}
          className="text-[11px] leading-[14px]"
        >
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
