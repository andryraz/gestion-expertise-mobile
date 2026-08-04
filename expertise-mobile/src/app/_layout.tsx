import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuth } from "@/context/auth-context";

SplashScreen.preventAutoHideAsync();

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === undefined || segments[0] === "register";

    if (!user && !inAuthGroup) {
      router.replace("/");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/dashboard" as any);
    }
  }, [user, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RouteGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </RouteGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}
