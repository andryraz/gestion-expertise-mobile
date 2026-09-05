import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MissionForm, type MissionFormValues } from "@/components/missions";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useCreateMission } from "@/queries/missions";
import { ApiError } from "@/services/api-client";
import { logger } from "@/utils/logger";

export default function NewMissionScreen() {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const createMissionMutation = useCreateMission();

  const handleSubmit = async (values: MissionFormValues) => {
    setError(null);
    try {
      const hasBuildingInfo =
        !!values.buildingAddress?.trim() ||
        !!values.buildingType?.trim() ||
        values.buildingGpsLat !== undefined ||
        values.buildingGpsLng !== undefined;

      const mission = await createMissionMutation.mutateAsync({
        title: values.title,
        missionType: values.missionType,
        legalContext: values.legalContext,
        initialBuilding: hasBuildingInfo
          ? {
              name: "Bâtiment principal",
              address: values.buildingAddress,
              buildingType: values.buildingType,
              gpsLat: values.buildingGpsLat,
              gpsLng: values.buildingGpsLng,
            }
          : undefined,
      });
      logger.info("Missions", "Mission créée", { id: mission.id });
      router.back();
      requestAnimationFrame(() => {
        router.push(`/missions/${mission.id}` as any);
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de créer la mission";
      setError(message);
      logger.error("Missions", "Échec de la création", message);
    }
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <View className="flex-row items-center gap-two px-four py-two">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={22} />
            </Pressable>
            <ThemedText
              type="smallBold"
              themeColor="accent"
              className="text-xl flex-1"
            >
              Nouvelle mission
            </ThemedText>
          </View>

          <KeyboardAvoidingView
            className="flex-1"
            behavior="padding"
            keyboardVerticalOffset={44}
          >
            <ScrollView
              contentContainerClassName="w-full max-w-content self-center px-four pb-six"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <MissionForm
                submitLabel="Créer la mission"
                isSubmitting={createMissionMutation.isPending}
                error={error}
                onSubmit={handleSubmit}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
