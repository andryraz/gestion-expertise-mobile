import { View, type ViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

const BG_CLASSES: Record<ThemeColor, string> = {
  text: "bg-text dark:bg-text-dark",
  background: "bg-background dark:bg-background-dark",
  backgroundElement: "bg-background-element dark:bg-background-element-dark",
  backgroundSelected: "bg-background-selected dark:bg-background-selected-dark",
  textSecondary: "bg-text-secondary dark:bg-text-secondary-dark",
  border: "bg-border dark:bg-border-dark",
  success: "bg-success dark:bg-success-dark",
  danger: "bg-danger dark:bg-danger-dark",
  accent: "bg-accent dark:bg-accent-dark",
};

export function ThemedView({
  className,
  style,
  type,
  ...otherProps
}: ThemedViewProps) {
  return (
    <View
      className={[BG_CLASSES[type ?? "background"], className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      {...otherProps}
    />
  );
}
