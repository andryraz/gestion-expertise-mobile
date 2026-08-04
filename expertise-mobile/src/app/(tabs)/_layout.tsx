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
    <Pressable {...props} className="flex-1 shrink items-center">
      <ThemedView
        type={isFocused ? "backgroundSelected" : undefined}
        className="min-w-[56px] items-center gap-0.5 rounded-two px-one py-one"
      >
        <SymbolView
          tintColor={isFocused ? theme.text : theme.textSecondary}
          name={{ ios: icon, web: icon } as any}
          size={18}
        />
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
          numberOfLines={1}
          className="text-[11px] leading-[14px]"
        >
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
