import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { Measurement } from "@/types/measurement";
import { formatMeasurementValue } from "@/utils/format-measurement";

type MeasurementRowProps = {
  measurement: Measurement;
  canManage: boolean;
  onMenuPress: (measurement: Measurement) => void;
};

export function MeasurementRow({
  measurement,
  canManage,
  onMenuPress,
}: MeasurementRowProps) {
  const theme = useTheme();

  return (
    <View className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark px-three py-three mb-two">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
        <Ionicons name="speedometer-outline" color={theme.accent} size={16} />
      </View>

      <View className="flex-1">
        <ThemedText type="smallBold" numberOfLines={1}>
          {measurement.measureType}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="accent">
          {formatMeasurementValue(measurement.value, measurement.unit)}
        </ThemedText>
        {measurement.label && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            numberOfLines={2}
            className="mt-half"
          >
            {measurement.label}
          </ThemedText>
        )}
      </View>

      {canManage && (
        <Pressable
          onPress={() => onMenuPress(measurement)}
          hitSlop={8}
          className="p-one"
        >
          <Ionicons
            name="ellipsis-horizontal"
            color={theme.textSecondary}
            size={18}
          />
        </Pressable>
      )}
    </View>
  );
}
