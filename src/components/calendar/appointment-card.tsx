import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONE,
  APPOINTMENT_TYPE_LABELS,
} from "@/constants/appointment-labels";
import { useTheme } from "@/hooks/use-theme";
import { Appointment, AppointmentType } from "@/types/appointment";
import { formatTime } from "@/utils/calendar-date";

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

const TYPE_ICON: Record<AppointmentType, keyof typeof Ionicons.glyphMap> = {
  APPEL: "call",
  VISITE_RECONNAISSANCE: "walk",
  RENDEZ_VOUS_SITE: "location",
  AUTRE: "ellipsis-horizontal-circle",
};

type AppointmentCardProps = {
  appointment: Appointment;
  onPress?: () => void;
};

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const theme = useTheme();
  const tone = APPOINTMENT_STATUS_TONE[appointment.status];

  return (
    <Pressable onPress={onPress} disabled={!onPress} className={onPress ? "active:opacity-70" : undefined}>
      <ThemedView
        type="backgroundElement"
        className="gap-two rounded-three border border-border p-three dark:border-border-dark"
      >
        <View className="flex-row items-center justify-between gap-two">
          <View className="flex-row items-center gap-one">
            <Ionicons name={TYPE_ICON[appointment.type]} color={theme.textSecondary} size={16} />
            <ThemedText type="smallBold">{formatTime(appointment.scheduledAt)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              · {APPOINTMENT_TYPE_LABELS[appointment.type]}
            </ThemedText>
          </View>
          <View className={["rounded-five border px-two py-half", TONE_CLASSES[tone]].join(" ")}>
            <ThemedText type="eyebrow" themeColor={TONE_TEXT_COLOR[tone]}>
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </ThemedText>
          </View>
        </View>

        {appointment.location && (
          <View className="flex-row items-center gap-one">
            <Ionicons name="location-outline" color={theme.textSecondary} size={15} />
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} className="flex-1">
              {appointment.location}
            </ThemedText>
          </View>
        )}

        {appointment.notes && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {appointment.notes}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}
