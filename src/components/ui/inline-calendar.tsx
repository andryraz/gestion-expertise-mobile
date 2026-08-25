import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type InlineCalendarProps = {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
};

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aDate.getTime() < bDate.getTime();
}

export function InlineCalendar({
  value,
  onChange,
  minDate,
}: InlineCalendarProps) {
  const theme = useTheme();
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark p-three">
      <View className="flex-row items-center justify-between mb-two">
        <Pressable onPress={goToPrev} hitSlop={8} className="p-one">
          <Ionicons name="chevron-back" color={theme.text} size={18} />
        </Pressable>
        <ThemedText type="smallBold" className="text-base">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </ThemedText>
        <Pressable onPress={goToNext} hitSlop={8} className="p-one">
          <Ionicons name="chevron-forward" color={theme.text} size={18} />
        </Pressable>
      </View>

      <View className="flex-row mb-one">
        {DAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <ThemedText type="eyebrow" themeColor="textSecondary">
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row">
          {row.map((day, colIdx) => {
            if (day === null) {
              return <View key={`empty-${colIdx}`} className="flex-1 h-9" />;
            }

            const cellDate = new Date(viewYear, viewMonth, day);
            const isSelected = isSameDay(cellDate, value);
            const isDisabled =
              minDate != null && isBeforeDay(cellDate, minDate);
            const isToday = isSameDay(cellDate, today);

            return (
              <View key={day} className="flex-1 items-center justify-center">
                <Pressable
                  onPress={() => {
                    if (!isDisabled) onChange(cellDate);
                  }}
                  disabled={isDisabled}
                  className={[
                    "h-9 w-9 items-center justify-center rounded-full",
                    isSelected
                      ? "bg-accent"
                      : isToday
                        ? "bg-background-selected dark:bg-background-selected-dark"
                        : "",
                  ].join(" ")}
                >
                  <ThemedText
                    type="smallBold"
                    themeColor={
                      isSelected
                        ? "background"
                        : isDisabled
                          ? "border"
                          : isToday
                            ? "accent"
                            : "text"
                    }
                  >
                    {day}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
