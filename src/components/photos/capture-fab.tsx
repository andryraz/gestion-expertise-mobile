import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type CaptureFabProps = {
  onPress: () => void;
  onLongPress?: () => void;
  badgeCount?: number;
  disabled?: boolean;
  bottomOffset?: number;
};

export function CaptureFab({
  onPress,
  onLongPress,
  badgeCount = 0,
  disabled,
  bottomOffset = 64,
}: CaptureFabProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      className="absolute bottom-six right-four h-14 w-14 items-center justify-center rounded-five bg-accent active:opacity-85"
      style={{
        bottom: bottomOffset,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Ionicons name="camera" color={theme.background} size={24} />
      {badgeCount > 0 && (
        <View className="absolute -top-one -right-one min-w-[20px] items-center justify-center rounded-five bg-danger px-one py-half">
          <ThemedText
            type="code"
            themeColor="background"
            className="text-[10px] font-bold leading-[14px]"
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}
