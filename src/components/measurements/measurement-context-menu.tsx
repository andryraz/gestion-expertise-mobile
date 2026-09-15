import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import type { Measurement } from "@/types/measurement";
import { formatMeasurementValue } from "@/utils/format-measurement";

type MeasurementContextMenuProps = {
  measurement: Measurement | null;
  onClose: () => void;
  onEdit: (measurement: Measurement) => void;
  onDelete: (measurement: Measurement) => void;
};

export function MeasurementContextMenu({
  measurement,
  onClose,
  onEdit,
  onDelete,
}: MeasurementContextMenuProps) {
  const theme = useTheme();

  if (!measurement) return null;

  return (
    <Pressable className="absolute inset-0 z-50 justify-end" onPress={onClose}>
      <View className="absolute inset-0 bg-black/50" />

      <ThemedView
        type="background"
        className="rounded-t-three border-t border-border dark:border-border-dark px-four pt-four pb-20"
      >
        <View className="flex-row items-center gap-three mb-three">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
            <Ionicons
              name="speedometer-outline"
              color={theme.accent}
              size={18}
            />
          </View>
          <View className="flex-1">
            <ThemedText type="smallBold" numberOfLines={1}>
              {measurement.measureType}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatMeasurementValue(measurement.value, measurement.unit)}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={() => onEdit(measurement)}
          className="flex-row items-center gap-three rounded-two px-two py-three active:opacity-70"
        >
          <Ionicons name="pencil" color={theme.text} size={20} />
          <ThemedText type="default" className="flex-1">
            Modifier
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => onDelete(measurement)}
          className="flex-row items-center gap-three rounded-two px-two py-three active:opacity-70"
        >
          <Ionicons name="trash-outline" color={theme.danger} size={20} />
          <ThemedText type="default" themeColor="danger" className="flex-1">
            Supprimer
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={onClose}
          className="mt-two items-center rounded-three bg-background-element dark:bg-background-element-dark py-three"
        >
          <ThemedText type="smallBold" themeColor="textSecondary">
            Annuler
          </ThemedText>
        </Pressable>
      </ThemedView>
    </Pressable>
  );
}
