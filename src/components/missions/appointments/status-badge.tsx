import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  APPOINTMENT_STATUS_BG,
  APPOINTMENT_STATUS_FG,
  APPOINTMENT_STATUS_LABELS,
} from "@/constants/appointment-labels";
import type { AppointmentStatus } from "@/types/appointment";

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <View
      className={`rounded-five px-two py-half ${APPOINTMENT_STATUS_BG[status]}`}
    >
      <ThemedText type="eyebrow" className={APPOINTMENT_STATUS_FG[status]}>
        {APPOINTMENT_STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}
