import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { ApiError } from "@/services/api-client";
import {
  archiveMission,
  getMission,
  unarchiveMission,
  updateMission,
  updateMissionStatus,
} from "@/services/mission-services";
import { Mission } from "@/types/mission";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { logger } from "@/utils/logger";

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadMission = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const result = await getMission(id);
      setMission(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de charger la mission";
      setLoadError(message);
      logger.error("Missions", "Échec du chargement de la mission", {
        id,
        message,
      });
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await loadMission();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadMission]);

  const handleSubmit = async (values: MissionFormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const { status: nextStatus, ...editable } = values;
      const updated = await updateMission(id, editable);
      if (nextStatus && nextStatus !== mission?.status) {
        const withStatus = await updateMissionStatus(id, nextStatus);
        setMission(withStatus);
      } else {
        setMission(updated);
      }
      logger.info("Missions", "Mission mise à jour", { id });
      router.back();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de mettre à jour la mission";
      setFormError(message);
      logger.error("Missions", "Échec de la mise à jour", { id, message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = () => {
    if (!id || !mission) return;
    const isArchived = !!mission.archivedAt;

    Alert.alert(
      isArchived ? "Désarchiver cette mission ?" : "Archiver cette mission ?",
      isArchived
        ? "Elle réapparaîtra dans la liste des missions actives."
        : "Elle sera retirée de la liste des missions actives.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: isArchived ? "Désarchiver" : "Archiver",
          style: isArchived ? "default" : "destructive",
          onPress: async () => {
            setIsArchiving(true);
            try {
              const updated = isArchived
                ? await unarchiveMission(id)
                : await archiveMission(id);
              setMission(updated);
              logger.info(
                "Missions",
                isArchived ? "Mission désarchivée" : "Mission archivée",
                { id },
              );
              router.back();
            } catch (err) {
              const message =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de modifier l'archivage de la mission";
              Alert.alert("Erreur", message);
              logger.error("Missions", "Échec de l'archivage", { id, message });
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <View className="flex-row items-center justify-between px-four py-two">
            <View className="flex-row items-center gap-two">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" color={theme.text} size={22} />
              </Pressable>
              <ThemedText type="subtitle" themeColor="accent" numberOfLines={1}>
                {mission ? `#${mission.reference}` : "Mission"}
              </ThemedText>
            </View>
            {mission && (
              <Pressable
                onPress={handleToggleArchive}
                disabled={isArchiving}
                hitSlop={8}
              >
                <Ionicons
                  name={mission.archivedAt ? "archive" : "archive-outline"}
                  color={mission.archivedAt ? theme.accent : theme.danger}
                  size={22}
                />
              </Pressable>
            )}
          </View>

          {isLoading && (
            <ThemedText themeColor="textSecondary" className="px-four">
              Chargement...
            </ThemedText>
          )}

          {loadError && !isLoading && (
            <ThemedText themeColor="danger" className="px-four">
              {loadError}
            </ThemedText>
          )}

          {mission && !isLoading && (
            <KeyboardAvoidingView
              className="flex-1"
              behavior="padding"
              keyboardVerticalOffset={44}
            >
              <ScrollView
                contentContainerClassName="w-full max-w-content gap-three self-center px-four pb-six"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {mission.archivedAt && (
                  <View className="rounded-two border border-border bg-background-element px-three py-two dark:border-border-dark dark:bg-background-element-dark">
                    <ThemedText type="small" themeColor="textSecondary">
                      Archivée {formatRelativeTime(mission.archivedAt)}
                    </ThemedText>
                  </View>
                )}

                <MissionForm
                  initialValues={mission}
                  showStatusField
                  submitLabel="Enregistrer les modifications"
                  isSubmitting={isSubmitting}
                  error={formError}
                  onSubmit={handleSubmit}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
