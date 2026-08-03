import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Mission } from "@/types/mission";

type MissionsTableProps = {
  missions: Mission[];
  onPressMission: (mission: Mission) => void;
};

export function MissionsTable({
  missions,
  onPressMission,
}: MissionsTableProps) {
  const theme = useTheme();

  if (missions.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" type="small">
        Aucune mission active pour le moment.
      </ThemedText>
    );
  }

  return (
    <View>
      {missions.map((mission, index) => (
        <Pressable
          key={mission.id}
          onPress={() => onPressMission(mission)}
          style={({ pressed }) => [
            styles.row,
            index === missions.length - 1 && styles.rowLast,
            { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <View style={styles.rowTop}>
            <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
              {mission.title}
            </ThemedText>
            <ThemedText type="eyebrow" themeColor="textSecondary">
              #{mission.reference}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {mission.buildingAddress ?? "Lieu non renseigné"}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: 4,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
});
