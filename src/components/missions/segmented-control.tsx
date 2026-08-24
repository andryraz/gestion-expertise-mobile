import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export type TabOption = {
  key: string;
  label: string;
  icon?: string;
};

type SegmentedControlProps = {
  options: TabOption[];
  value: string;
  onChange: (key: string) => void;
};

export function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  const theme = useTheme();

  return (
    <View
      className="flex-row rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark mx-four py-half px-half"
    >
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}              className={[
              "flex-1 items-center justify-center rounded-two py-[7px]",
              isActive
                ? "bg-accent"
                : "bg-transparent",
            ].join(" ")}
            style={({ pressed }: { pressed: boolean }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <ThemedText
              type="smallBold"
              themeColor={isActive ? "background" : "textSecondary"}
              numberOfLines={1}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
