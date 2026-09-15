import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { MeasurementRow } from "@/components/measurements/measurement-row";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { Measurement } from "@/types/measurement";

type MeasurementListProps = {
  measurements: Measurement[];
  emptyLabel: string;
  canManage: boolean;
  onMenuPress: (measurement: Measurement) => void;
};

export function MeasurementList({
  measurements,
  emptyLabel,
  canManage,
  onMenuPress,
}: MeasurementListProps) {
  const theme = useTheme();

  if (measurements.length === 0) {
    return (
      <View className="items-center py-three">
        <Ionicons
          name="speedometer-outline"
          color={theme.textSecondary}
          size={24}
        />
        <ThemedText type="small" themeColor="textSecondary" className="mt-one">
          {emptyLabel}
        </ThemedText>
      </View>
    );
  }

  return (
    <View>
      {measurements.map((measurement) => (
        <MeasurementRow
          key={measurement.id}
          measurement={measurement}
          canManage={canManage}
          onMenuPress={onMenuPress}
        />
      ))}
    </View>
  );
}
