import { PropsWithChildren } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

type ScreenFadeProps = PropsWithChildren<{
  className?: string;
}>;

export function ScreenFade({ children, className }: ScreenFadeProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className={className}
      style={{ flex: 1 }}
    >
      {children}
    </Animated.View>
  );
}
