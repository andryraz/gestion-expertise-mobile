import { PropsWithChildren } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

type ScreenFadeProps = PropsWithChildren<{
  className?: string;
}>;

/**
 * Wraps screen content with a gentle fade + slide-up entrance animation.
 * Complements the native stack transition with a softer content reveal.
 */
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
