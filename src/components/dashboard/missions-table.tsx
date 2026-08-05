import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MISSION_TYPE_LABELS } from "@/constants/mission-labels";
import { Mission } from "@/types/mission";

type MissionsTableProps = {
  missions: Mission[];
  onPressMission: (mission: Mission) => void;
};

const COLUMNS = [
  { key: "reference", label: "Référence", width: "w-[90px]" },
  { key: "title", label: "Titre", width: "w-[190px]" },
  { key: "missionType", label: "Type", width: "w-[160px]" },
  { key: "buildingAddress", label: "Adresse", width: "w-[210px]" },
] as const;

export function MissionsTable({
  missions,
  onPressMission,
}: MissionsTableProps) {
  if (missions.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" type="small">
        Aucune mission active pour le moment.
      </ThemedText>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-two"
    >
      <View className="px-two">
        <View className="flex-row border-b border-border pb-one dark:border-border-dark">
          {COLUMNS.map((column) => (
            <ThemedText
              key={column.key}
              type="eyebrow"
              themeColor="textSecondary"
              className={[column.width, "pr-two"].join(" ")}
            >
              {column.label}
            </ThemedText>
          ))}
        </View>

        {missions.map((mission, index) => (
          <Pressable
            key={mission.id}
            onPress={() => onPressMission(mission)}
            className={[
              "flex-row items-center border-b border-border py-two dark:border-border-dark",
              index === missions.length - 1 ? "border-b-0" : "",
            ].join(" ")}
            style={({ pressed }: { pressed: boolean }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ThemedText
              type="eyebrow"
              themeColor="textSecondary"
              className={[COLUMNS[0].width, "pr-two"].join(" ")}
              numberOfLines={1}
            >
              #{mission.reference}
            </ThemedText>
            <ThemedText
              type="smallBold"
              className={[COLUMNS[1].width, "pr-two"].join(" ")}
              numberOfLines={1}
            >
              {mission.title}
            </ThemedText>
            <ThemedText
              type="small"
              className={[COLUMNS[2].width, "pr-two"].join(" ")}
              numberOfLines={1}
            >
              {MISSION_TYPE_LABELS[mission.missionType] ?? mission.missionType}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              className={COLUMNS[3].width}
              numberOfLines={1}
            >
              {mission.buildingAddress ?? "Lieu non renseigné"}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
