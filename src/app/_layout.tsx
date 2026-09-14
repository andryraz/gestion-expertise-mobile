import { QueryClientProvider } from "@tanstack/react-query";
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
import { queryClient } from "@/lib/query-client";
import { getAppointments } from "@/services/appointment-services";
import {
  ensureNotificationSetup,
  syncAppointmentReminders,
} from "@/services/notification-services";
import { useAuthStore } from "@/store/auth-store";
import { logger } from "@/utils/logger";

SplashScreen.preventAutoHideAsync();

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const granted = await ensureNotificationSetup();
      if (!granted || cancelled) return;
      try {
        const from = new Date().toISOString();
        const to = new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const upcoming = await getAppointments(from, to);
        if (!cancelled) await syncAppointmentReminders(upcoming);
      } catch (err) {
        logger.error("Notifications", "Échec resynchronisation des rappels", {
          err: err instanceof Error ? err.message : err,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) return null;

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RouteGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 350,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="register"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="missions/new"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="missions/[id]" />
            <Stack.Screen
              name="missions/appointment-form"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="buildings/[buildingId]/zones" />
            <Stack.Screen name="zones/[zoneId]" />
            <Stack.Screen
              name="zones/zone-form"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="zones/zone-move"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="observations/observation-form"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="observations/[observationId]" />
          </Stack>
        </RouteGuard>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
