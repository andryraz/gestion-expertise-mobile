import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  APPOINTMENT_TYPE_LABELS
} from "@/constants/appointment-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissionAppointments } from "@/services/appointment-services";
import { type Appointment } from "@/types/appointment";

type MissionRdvTabProps = {
  missionId: string;
  isArchived: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MissionRdvTab({ missionId, isArchived }: MissionRdvTabProps) {
  const theme = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getMissionAppointments(missionId);
        if (!cancelled) {
          const sorted = [...result].sort(
            (a, b) =>
              new Date(a.scheduledAt).getTime() -
              new Date(b.scheduledAt).getTime(),
          );
          setAppointments(sorted);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Impossible de charger les rendez-vous";
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missionId]);

  if (isLoading) {
    return (
      <ThemedText themeColor="textSecondary" className="text-center py-four">
        Chargement...
      </ThemedText>
    );
  }

  if (error) {
    return (
      <ThemedText themeColor="danger" className="text-center py-four">
        {error}
      </ThemedText>
    );
  }

  const nextAppointment = appointments.find(
    (a) =>
      (a.status === "PLANIFIE" || a.status === "CONFIRME") &&
      new Date(a.scheduledAt) >= new Date(),
  );

  return (
    <View>
      {nextAppointment ? (
        <ThemedView
          type="backgroundElement"
          className="rounded-three border border-border dark:border-border-dark p-three"
        >
          <View className="flex-row items-center gap-two mb-two">
            <Ionicons name="calendar" color={theme.accent} size={16} />
            <ThemedText type="eyebrow" themeColor="accent">
              Prochain rendez-vous
            </ThemedText>
          </View>

          <ThemedText type="smallBold" className="text-base leading-6">
            {APPOINTMENT_TYPE_LABELS[nextAppointment.type]}
          </ThemedText>

          <View className="flex-row items-center gap-two mt-one">
            <Ionicons name="time" color={theme.textSecondary} size={14} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(nextAppointment.scheduledAt)} à{" "}
              {formatTime(nextAppointment.scheduledAt)}
            </ThemedText>
          </View>

          {nextAppointment.location && (
            <View className="flex-row items-center gap-two mt-one">
              <Ionicons name="location" color={theme.textSecondary} size={14} />
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={2}
              >
                {nextAppointment.location}
              </ThemedText>
            </View>
          )}
        </ThemedView>
      ) : (
        <View className="items-center py-four">
          <Ionicons
            name="calendar-outline"
            color={theme.textSecondary}
            size={32}
          />
          <ThemedText themeColor="textSecondary" className="mt-two text-center">
            Aucun rendez-vous à venir
          </ThemedText>
        </View>
      )}

      {appointments.length > 0 && (
        <Pressable
          className="mt-three flex-row items-center justify-center gap-one rounded-three border border-border dark:border-border-dark py-two"
          hitSlop={8}
        >
          <ThemedText type="small" themeColor="accent">
            Voir tout
          </ThemedText>
          <Ionicons name="chevron-forward" color={theme.accent} size={14} />
        </Pressable>
      )}
    </View>
  );
}
