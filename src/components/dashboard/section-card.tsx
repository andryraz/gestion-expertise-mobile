import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";

type SectionCardProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
  accent?: boolean;
};

export function SectionCard({
  icon,
  title,
  children,
  accent = false,
}: SectionCardProps) {
  const theme = useTheme();
  return (
    <ThemedView
      type="backgroundElement"
      className={[
        "gap-three rounded-three p-three",
        accent ? "border border-accent" : "",
      ].join(" ")}
    >
      <View className="flex-row items-center gap-one">
        {icon && (
          <Ionicons
            name={icon}
            color={accent ? theme.accent : theme.text}
            size={18}
          />
        )}
        <ThemedText type="eyebrow" themeColor={accent ? "accent" : "text"}>
          {title}
        </ThemedText>
      </View>
      <View className="gap-two">{children}</View>
    </ThemedView>
  );
}
