import { useMemo } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { APPOINTMENT_STATUS_TONE } from "@/constants/appointment-labels";
import { StatusTone } from "@/constants/mission-labels";
import { useTheme } from "@/hooks/use-theme";
import { Appointment } from "@/types/appointment";
import {
  formatTime,
  getMonthGridDays,
  isSameDay,
  isSameMonth,
  toDateKey,
} from "@/utils/calendar-date";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const CELL_BASIS = "14.2857%";
// Nombre maximal de rendez-vous affichés dans une cellule avant le "+N".
const MAX_CELL_ITEMS = 2;

type MonthGridProps = {
  month: Date;
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
};

export function MonthGrid({
  month,
  appointments,
  selectedDate,
  onSelectDay,
}: MonthGridProps) {
  const theme = useTheme();
  const today = new Date();

  const days = useMemo(() => getMonthGridDays(month), [month]);
  const rows = days.length / 7;

  // Rendez-vous indexés par jour civil, pour un accès direct par cellule.
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of appointments) {
      const key = toDateKey(new Date(appointment.scheduledAt));
      const list = map.get(key);
      if (list) list.push(appointment);
      else map.set(key, [appointment]);
    }
    return map;
  }, [appointments]);

  const toneColor: Record<StatusTone, string> = {
    muted: theme.textSecondary,
    accent: theme.accent,
    success: theme.success,
    danger: theme.danger,
  };

  return (
    <View>
      <View className="flex-row border-b border-border pb-one dark:border-border-dark">
        {WEEKDAY_LABELS.map((label) => (
          <View
            key={label}
            style={{ flexBasis: CELL_BASIS }}
            className="items-center"
          >
            <ThemedText type="smallBold" themeColor="textSecondary">
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap overflow-hidden rounded-three border border-border dark:border-border-dark">
        {days.map((day, index) => {
          const column = index % 7;
          const row = Math.floor(index / 7);
          const inCurrentMonth = isSameMonth(day, month);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          // Les cellules hors mois (jours du mois précédent/suivant) n'ont pas
          // de rendez-vous : on ne récupère que la période du mois affiché.
          const dayItems = inCurrentMonth ? byDay.get(toDateKey(day)) ?? [] : [];

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelectDay(day)}
              className={[
                "border-border active:opacity-70 dark:border-border-dark",
                column !== 6 && "border-r",
                row !== rows - 1 && "border-b",
                isSelected
                  ? "bg-background-selected dark:bg-background-selected-dark"
                  : "bg-background dark:bg-background-dark",
                inCurrentMonth ? "" : "opacity-40",
              ].join(" ")}
              style={{ flexBasis: CELL_BASIS, minHeight: 72 }}
            >
              <View className="items-end px-half pt-half">
                {isToday ? (
                  <View className="min-w-5 items-center justify-center rounded-full bg-accent px-one">
                    <ThemedText type="smallBold" themeColor="background">
                      {day.getDate()}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText
                    type={isSelected ? "smallBold" : "small"}
                    themeColor={inCurrentMonth ? "text" : "textSecondary"}
                  >
                    {day.getDate()}
                  </ThemedText>
                )}
              </View>

              <View className="gap-half px-half pb-half">
                {dayItems.slice(0, MAX_CELL_ITEMS).map((appointment) => (
                  <View
                    key={appointment.id}
                    className="flex-row items-center gap-half"
                  >
                    <View
                      className="h-one w-one rounded-full"
                      style={{
                        backgroundColor:
                          toneColor[APPOINTMENT_STATUS_TONE[appointment.status]],
                      }}
                    />
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={1}
                      className="shrink"
                    >
                      {formatTime(appointment.scheduledAt)}
                    </ThemedText>
                  </View>
                ))}
                {dayItems.length > MAX_CELL_ITEMS && (
                  <ThemedText type="small" themeColor="textSecondary">
                    +{dayItems.length - MAX_CELL_ITEMS}
                  </ThemedText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
