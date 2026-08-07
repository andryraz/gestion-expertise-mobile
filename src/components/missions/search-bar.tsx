import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

type MissionSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function MissionSearchBar({
  value,
  onChangeText,
  placeholder = "Rechercher par référence, titre ou lieu...",
}: MissionSearchBarProps) {
  const theme = useTheme();

  return (
    <View className="flex-row items-center gap-two rounded-three border border-border bg-background-element px-three py-three dark:border-border-dark dark:bg-background-element-dark">
      <Ionicons name="search" color={theme.textSecondary} size={18} />
      <TextInput
        className="flex-1 p-0 text-base leading-6 text-text dark:text-text-dark"
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <Ionicons name="close-circle" color={theme.textSecondary} size={18} />
        </Pressable>
      )}
    </View>
  );
}
