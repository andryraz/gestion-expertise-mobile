import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type PrimaryButtonProps = {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({
  label,
  loadingLabel,
  onPress,
  disabled,
  loading,
  icon,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isActive = !disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        "mt-one flex-row items-center justify-center gap-two rounded-three py-three",
        isActive
          ? "bg-accent"
          : "bg-background-selected dark:bg-background-selected-dark",
      ].join(" ")}
      style={({ pressed }: { pressed: boolean }) => ({
        opacity: pressed && isActive ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator
          color={isActive ? theme.background : theme.textSecondary}
        />
      ) : (
        <>
          <ThemedText
            className="text-base leading-5 font-bold tracking-[0.5px] uppercase"
            themeColor={isActive ? "background" : "textSecondary"}
          >
            {loading ? (loadingLabel ?? label) : label}
          </ThemedText>
          {icon && (
            <Ionicons
              name={icon}
              color={isActive ? theme.background : theme.textSecondary}
              size={18}
            />
          )}
        </>
      )}
    </Pressable>
  );
}
