import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  APPOINTMENT_TYPE_LABELS,
} from "@/constants/appointment-labels";
import { useTheme } from "@/hooks/use-theme";
import type { Appointment } from "@/types/appointment";
import { formatDate, formatTime } from "@/utils/calendar-date";

import { StatusBadge } from "./status-badge";

const TYPE_ICONS: Record<string, string> = {
  APPEL: "call",
  VISITE_RECONNAISSANCE: "eye",
  RENDEZ_VOUS_SITE: "location",
  AUTRE: "ellipsis-horizontal",
};

type AppointmentRowProps = {
  appointment: Appointment;
  onPress: () => void;
  onReschedule: () => void;
};

export function AppointmentRow({
  appointment,
  onPress,
  onReschedule,
}: AppointmentRowProps) {
  const theme = useTheme();
  const canReschedule =
    appointment.status !== "ANNULE" &&
    appointment.status !== "REPORTE" &&
    appointment.status !== "REALISE";

  const renderRightActions = () => {
    if (!canReschedule) return null;
    return (
      <Pressable
        onPress={onReschedule}
        className="items-center justify-center rounded-three px-four"
        style={{ backgroundColor: theme.accent, width: 80 }}
      >
        <Ionicons name="time" color={theme.background} size={20} />
        <ThemedText type="smallBold" themeColor="background">
          Reporter
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Pressable onPress={onPress}>
        <ThemedView
          type="backgroundElement"
          className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
            <Ionicons
              name={TYPE_ICONS[appointment.type] as any}
              color={theme.accent}
              size={18}
            />
          </View>

          <View className="flex-1">
            <ThemedText type="smallBold">
              {APPOINTMENT_TYPE_LABELS[appointment.type]}
            </ThemedText>
            <View className="flex-row items-center gap-one mt-half">
              <Ionicons name="time" color={theme.textSecondary} size={12} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(appointment.scheduledAt)} à{" "}
                {formatTime(appointment.scheduledAt)}
              </ThemedText>
            </View>
            {appointment.location && (
              <View className="flex-row items-center gap-one mt-half">
                <Ionicons
                  name="location"
                  color={theme.textSecondary}
                  size={12}
                />
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={1}
                >
                  {appointment.location}
                </ThemedText>
              </View>
            )}
          </View>

          <StatusBadge status={appointment.status} />
        </ThemedView>
      </Pressable>
    </Swipeable>
  );
}
