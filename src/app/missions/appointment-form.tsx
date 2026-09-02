import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/auth/primary-button";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ChipSelect } from "@/components/ui/chip-select";
import { InlineCalendar } from "@/components/ui/inline-calendar";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "@/constants/appointment-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import {
  createAppointment,
  getAppointment,
  updateAppointment,
} from "@/services/appointment-services";
import { scheduleAppointmentReminder } from "@/services/notification-services";
import { type Appointment, type AppointmentType } from "@/types/appointment";
import { formatDateLong } from "@/utils/calendar-date";
import { logger } from "@/utils/logger";

type Mode = "create" | "reschedule";

type FormParams = {
  missionId: string;
  mode: Mode;
  appointmentId?: string;
};

const TYPE_OPTIONS = [
  { value: "APPEL" as AppointmentType, label: "Appel" },
  {
    value: "VISITE_RECONNAISSANCE" as AppointmentType,
    label: "Visite reconnaissance",
  },
  { value: "RENDEZ_VOUS_SITE" as AppointmentType, label: "Rendez-vous site" },
  { value: "AUTRE" as AppointmentType, label: "Autre" },
];

function isDateInFuture(d: Date): boolean {
  const now = new Date();
  return d.getTime() > now.getTime();
}

function TimePicker({
  value,
  onChange,
  theme,
}: {
  value: Date;
  onChange: (d: Date) => void;
  theme: any;
}) {
  const [hourText, setHourText] = useState(
    String(value.getHours()).padStart(2, "0"),
  );
  const [minuteText, setMinuteText] = useState(
    String(value.getMinutes()).padStart(2, "0"),
  );

  useEffect(() => {
    setHourText(String(value.getHours()).padStart(2, "0"));
    setMinuteText(String(value.getMinutes()).padStart(2, "0"));
  }, [value.getHours(), value.getMinutes()]);

  const clamp = (text: string, max: number) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10);
    if (num > max) return String(max).padStart(2, "0");
    return digits;
  };

  const commitHour = () => {
    const num = parseInt(clamp(hourText, 23), 10);
    const safe = isNaN(num) ? 0 : num;
    const d = new Date(value);
    d.setHours(safe);
    onChange(d);
  };

  const commitMinute = () => {
    const num = parseInt(clamp(minuteText, 59), 10);
    const safe = isNaN(num) ? 0 : num;
    const d = new Date(value);
    d.setMinutes(safe);
    onChange(d);
  };

  const inputClass = [
    "rounded-three border dark:border-border-dark px-three py-two text-center text-lg font-semibold",
    "border-border bg-background dark:bg-background-dark text-text dark:text-text-dark",
  ].join(" ");

  return (
    <View className="mb-three">
      <ThemedText type="small" themeColor="textSecondary" className="mb-two">
        Heure
      </ThemedText>

      <View className="flex-row items-center gap-two">
        <TextInput
          value={hourText}
          onChangeText={(t) => setHourText(clamp(t, 23))}
          onBlur={commitHour}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="09"
          placeholderTextColor={theme.textSecondary}
          className={[inputClass, "flex-1"].join(" ")}
        />
        <ThemedText type="subtitle" themeColor="textSecondary">
          :
        </ThemedText>
        <TextInput
          value={minuteText}
          onChangeText={(t) => setMinuteText(clamp(t, 59))}
          onBlur={commitMinute}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={theme.textSecondary}
          className={[inputClass, "flex-1"].join(" ")}
        />
      </View>
    </View>
  );
}

export default function AppointmentFormScreen() {
  const { missionId, mode, appointmentId } = useLocalSearchParams<FormParams>();
  const theme = useTheme();

  const isReschedule = mode === "reschedule";

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(
    isReschedule && !!appointmentId,
  );

  const [type, setType] = useState<AppointmentType>("APPEL");
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  useEffect(() => {
    if (!isReschedule || !appointmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getAppointment(appointmentId);
        if (!cancelled) {
          setAppointment(result);
          setScheduledAt(new Date(result.scheduledAt));
          setLocation(result.location ?? "");
          setNotes(result.notes ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          Alert.alert("Erreur", "Impossible de charger le rendez-vous");
          router.back();
        }
      } finally {
        if (!cancelled) setIsLoadingAppointment(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReschedule, appointmentId]);

  // In reschedule mode, the type is inherited
  useEffect(() => {
    if (isReschedule && appointment) {
      setType(appointment.type);
    }
  }, [isReschedule, appointment]);

  const isLocationRequired = type !== "APPEL";

  const handleSubmit = async () => {
    // Validate future date
    if (!isDateInFuture(scheduledAt)) {
      Alert.alert(
        "Date invalide",
        "La date du rendez-vous doit être supérieure à la date d'aujourd'hui.",
      );
      return;
    }

    // Validate location
    if (isLocationRequired && !location.trim()) {
      Alert.alert(
        "Erreur",
        "Le lieu est obligatoire pour ce type de rendez-vous",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isReschedule && appointmentId) {
        const updated = await updateAppointment(appointmentId, {
          scheduledAt: scheduledAt.toISOString(),
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        await scheduleAppointmentReminder(updated);
        logger.info("RDV", "Rendez-vous reporté", { id: appointmentId });
        router.back();
      } else {
        const created = await createAppointment(missionId!, {
          type,
          scheduledAt: scheduledAt.toISOString(),
          location: isLocationRequired ? location.trim() : undefined,
          notes: notes.trim() || undefined,
        });
        await scheduleAppointmentReminder(created);
        logger.info("RDV", "Rendez-vous créé", { id: created.id });
        router.back();
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : isReschedule
            ? "Impossible de reporter le rendez-vous"
            : "Impossible de créer le rendez-vous";
      Alert.alert("Erreur", message);
      logger.error("RDV", `Échec de ${isReschedule ? "report" : "création"}`, {
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAppointment) {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <ThemedText
            themeColor="textSecondary"
            className="text-center py-four"
          >
            Chargement...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-row items-center gap-two px-four pt-three pb-four">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" color={theme.text} size={24} />
              </Pressable>
              <ThemedText
                type="smallBold"
                className="text-xl flex-1"
                themeColor="accent"
              >
                {isReschedule
                  ? "Reporter le rendez-vous"
                  : "Nouveau rendez-vous"}
              </ThemedText>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 250,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {!isReschedule && (
                <View className="mb-four">
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    className="mb-two"
                  >
                    Type de rendez-vous
                  </ThemedText>
                  <ChipSelect
                    options={TYPE_OPTIONS}
                    value={type}
                    onChange={setType}
                  />
                </View>
              )}

              {isReschedule && appointment && (
                <ThemedView
                  type="backgroundElement"
                  className="rounded-three border border-border dark:border-border-dark px-three py-two mb-four"
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Type : {APPOINTMENT_TYPE_LABELS[appointment.type]}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Statut actuel :{" "}
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </ThemedText>
                </ThemedView>
              )}

              <View className="mb-three">
                <Pressable
                  onPress={() => setShowCalendar(!showCalendar)}
                  className="flex-row items-center justify-between mb-two"
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Date du rendez-vous
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor="accent">
                    {formatDateLong(scheduledAt.toISOString())}
                  </ThemedText>
                </Pressable>

                {showCalendar && (
                  <InlineCalendar
                    value={scheduledAt}
                    onChange={(d) => {
                      const newDate = new Date(scheduledAt);
                      newDate.setFullYear(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate(),
                      );
                      setScheduledAt(newDate);
                    }}
                    minDate={new Date()}
                  />
                )}
              </View>

              <TimePicker
                value={scheduledAt}
                onChange={setScheduledAt}
                theme={theme}
              />

              {isLocationRequired && (
                <View className="mb-three">
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    className="mb-one"
                  >
                    Lieu *
                  </ThemedText>
                  <TextInput
                    className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                    placeholder="Adresse ou lieu du rendez-vous"
                    placeholderTextColor={theme.textSecondary}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              )}

              <View className="mb-four">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Notes (optionnel)
                </ThemedText>
                <TextInput
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium min-h-[80px]"
                  placeholder="Ajouter des notes..."
                  placeholderTextColor={theme.textSecondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <PrimaryButton
                label={
                  isReschedule
                    ? "Reporter le rendez-vous"
                    : "Créer le rendez-vous"
                }
                onPress={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingLabel="En cours..."
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
