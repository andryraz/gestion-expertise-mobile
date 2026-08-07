import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
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
    <View className="gap-two rounded-three bg-accent p-three">
      <ThemedText type="eyebrow" themeColor="background" className="opacity-70">
        {eyebrow}
      </ThemedText>
      <ThemedText
        themeColor="background"
        className="text-lg leading-6 font-bold"
      >
        {title}
      </ThemedText>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-center gap-one rounded-two bg-background py-two dark:bg-background-dark"
        style={({ pressed }: { pressed: boolean }) => ({
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="add" color={theme.text} size={16} />
        <ThemedText type="smallBold">{actionLabel}</ThemedText>
      </Pressable>
    </View>
  );
}
