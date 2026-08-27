import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  MISSION_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/constants/mission-labels";
import { useTheme } from "@/hooks/use-theme";
import { Mission } from "@/types/mission";
import { formatBuildingSummary } from "@/utils/format-building-summary";
import { formatRelativeTime } from "@/utils/format-relative-time";

const TONE_CLASSES = {
  muted:
    "border-border bg-background-selected dark:border-border-dark dark:bg-background-selected-dark",
  accent: "border-accent bg-accent",
  success:
    "border-success bg-success dark:border-success-dark dark:bg-success-dark",
  danger: "border-danger bg-danger dark:border-danger-dark dark:bg-danger-dark",
} as const;

const TONE_TEXT_COLOR = {
  muted: "textSecondary",
  accent: "background",
  success: "background",
  danger: "background",
} as const;

type MissionCardProps = {
  mission: Mission;
  onPress?: () => void;
};

export function MissionCard({ mission, onPress }: MissionCardProps) {
  const theme = useTheme();
  const tone = STATUS_TONE[mission.status];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={onPress ? "active:opacity-70" : undefined}
    >
      <ThemedView
        type="backgroundElement"
        className="gap-two rounded-three border border-border p-three dark:border-border-dark"
      >
        <View className="flex-row items-center justify-between gap-two">
          <ThemedText type="eyebrow" themeColor="textSecondary">
            #{mission.reference}
          </ThemedText>
          <View
            className={[
              "rounded-five border px-two py-half",
              TONE_CLASSES[tone],
            ].join(" ")}
          >
            <ThemedText type="eyebrow" themeColor={TONE_TEXT_COLOR[tone]}>
              {STATUS_LABELS[mission.status]}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          type="smallBold"
          className="text-base leading-6"
          numberOfLines={2}
        >
          {mission.title}
        </ThemedText>

        <View className="flex-row items-center gap-one">
          <Ionicons name="location" color={theme.textSecondary} size={15} />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            numberOfLines={1}
            className="flex-1"
          >
            {formatBuildingSummary(mission.buildings ?? [], "short")}
          </ThemedText>
        </View>

        <View className="flex-row items-center justify-between gap-two border-t border-border pt-two dark:border-border-dark">
          <ThemedText type="small" themeColor="textSecondary">
            {MISSION_TYPE_LABELS[mission.missionType]}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Mis à jour {formatRelativeTime(mission.updatedAt)}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}
