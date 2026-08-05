import { SymbolView } from "expo-symbols";
import { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function CheckboxRow({ checked, onToggle, children }: CheckboxRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-start gap-two"
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        className={[
          "mt-0.5 h-5 w-5 items-center justify-center rounded-[5px] border-[1.5px]",
          checked
            ? "border-accent bg-accent"
            : "border-border dark:border-border-dark bg-transparent",
        ].join(" ")}
      >
        {checked && (
          <SymbolView
            tintColor={theme.background}
            name={{ ios: "checkmark", web: "checkmark" } as any}
            size={12}
            weight="bold"
          />
        )}
      </View>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        className="flex-1 leading-[19px]"
      >
        {children}
      </ThemedText>
    </Pressable>
  );
}
