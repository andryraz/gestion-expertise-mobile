import { Image, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

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
  return (
    <View className="flex-row items-center gap-two">
      <View
        className={[
          "items-center justify-center bg-accent",
          compact ? "h-9 w-9 rounded-[6px]" : "h-11 w-11 rounded-two",
        ].join(" ")}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: compact ? 30 : 36, height: compact ? 30 : 36 }}
          resizeMode="contain"
        />
      </View>
      <View className="gap-0.5">
        <ThemedText
          type={compact ? "smallBold" : "default"}
          themeColor="accent"
          className="font-bold"
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
