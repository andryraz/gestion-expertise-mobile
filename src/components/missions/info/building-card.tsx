import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import type { Building } from "@/types/building";

type BuildingCardProps = {
  building: Building;
  isArchived: boolean;
  /** Ouvre l'arborescence des zones du bâtiment. */
  onPress: () => void;
  /** Ouvre le formulaire d'édition du bâtiment. */
  onEdit: () => void;
};

export function BuildingCard({
  building,
  isArchived,
  onPress,
  onEdit,
}: BuildingCardProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
    >
      <Pressable
        onPress={onPress}
        disabled={isArchived}
        className="flex-1 flex-row items-center gap-three"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
          <Ionicons name="business" color={theme.accent} size={18} />
        </View>

        <View className="flex-1">
          <ThemedText type="smallBold" numberOfLines={1}>
            {building.name}
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            numberOfLines={1}
          >
            {building.address || "Adresse non renseignée"}
          </ThemedText>
        </View>

        {building.gpsLat != null && building.gpsLng != null && (
          <Ionicons
            name="navigate-outline"
            color={theme.textSecondary}
            size={16}
          />
        )}
        {!isArchived && (
          <Ionicons
            name="chevron-forward"
            color={theme.textSecondary}
            size={16}
          />
        )}
      </Pressable>

      {!isArchived && (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark"
        >
          <Ionicons name="pencil" color={theme.textSecondary} size={16} />
        </Pressable>
      )}
    </ThemedView>
  );
}