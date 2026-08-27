import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/auth/primary-button";
import {
  MissionDevisTab,
  MissionInfoTab,
  MissionPartiesTab,
  MissionRdvTab,
  SegmentedControl,
  StatusTimeline,
} from "@/components/missions";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  MISSION_TYPE_LABELS,
  STATUS_ACTION_LABEL,
  STATUS_ADVANCE,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/constants/mission-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import {
  archiveMission,
  getMission,
  unarchiveMission,
  updateMission,
  updateMissionStatus,
} from "@/services/mission-services";
import { Mission, UpdateMissionPayload } from "@/types/mission";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { logger } from "@/utils/logger";

const TABS = [
  { key: "infos", label: "Infos" },
  { key: "parties", label: "Parties" },
  { key: "rdv", label: "RDV" },
  { key: "devis", label: "Devis" },
];

const TONE_BG = {
  muted: "bg-background-selected dark:bg-background-selected-dark",
  accent: "bg-accent",
  success: "bg-success dark:bg-success-dark",
  danger: "bg-danger dark:bg-danger-dark",
} as const;

const TONE_TEXT = {
  muted: "textSecondary",
  accent: "background",
  success: "background",
  danger: "background",
} as const;

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("infos");
  const [showMenu, setShowMenu] = useState(false);

  const requestId = useRef(0);

  const loadMission = useCallback(async () => {
    if (!id) return;
    const req = ++requestId.current;
    setLoadError(null);
    try {
      const result = await getMission(id);
      if (req === requestId.current) setMission(result);
    } catch (err) {
      if (req !== requestId.current) return;
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

  const isArchived = !!mission?.archivedAt;

  const handleToggleArchive = () => {
    if (!id || !mission) return;

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
              if (!isArchived) router.back();
            } catch (err) {
              const message =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de modifier l'archivage de la mission";
              Alert.alert("Erreur", message);
              logger.error("Missions", "Échec de l'archivage", {
                id,
                message,
              });
            } finally {
              setIsArchiving(false);
              setShowMenu(false);
            }
          },
        },
      ],
    );
  };

  const handlePrimaryAction = () => {
    if (mission?.status === "DEVIS_ENVOYE" || mission?.status === "REFUSEE") {
      setActiveTab("devis");
      return;
    }
    handleAdvanceStatus();
  };

  const handleAdvanceStatus = async () => {
    if (!id || !mission) return;
    const next = STATUS_ADVANCE[mission.status];
    if (!next || next === mission.status) return;

    setIsSubmitting(true);
    try {
      const updated = await updateMissionStatus(id, next);
      setMission(updated);
      logger.info("Missions", "Statut avancé", {
        id,
        from: mission.status,
        to: next,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de changer le statut";
      Alert.alert("Erreur", message);
      logger.error("Missions", "Échec de l'avancement du statut", {
        id,
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInfo = async (payload: UpdateMissionPayload) => {
    if (!id) return;
    const updated = await updateMission(id, payload);
    setMission(updated);
    logger.info("Missions", "Informations mises à jour", { id });
  };

  const handleBuildingsChange = (buildings: Mission["buildings"]) => {
    setMission((prev) => (prev ? { ...prev, buildings } : prev));
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <View className="flex-row items-center justify-between px-four pt-three pb-four">
            <View className="flex-row items-center gap-two flex-1">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" color={theme.text} size={24} />
              </Pressable>
              <View className="flex-1">
                {mission && (
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    numberOfLines={1}
                    className="text-base"
                  >
                    #{mission.reference}
                  </ThemedText>
                )}
                <ThemedText
                  type="smallBold"
                  numberOfLines={2}
                  className="text-xl leading-7"
                >
                  {mission?.title ?? "Mission"}
                </ThemedText>
              </View>
            </View>

            {mission && (
              <View className="relative">
                <Pressable
                  onPress={() => setShowMenu(!showMenu)}
                  hitSlop={8}
                  className="p-one"
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    color={theme.text}
                    size={20}
                  />
                </Pressable>
                {showMenu && (
                  <>
                    <Pressable
                      className="absolute inset-0 z-10"
                      onPress={() => setShowMenu(false)}
                    />
                    <View
                      className="absolute right-0 top-full z-20 rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark py-one"
                      style={{
                        elevation: 4,
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        minWidth: 180,
                      }}
                    >
                      <Pressable
                        onPress={handleToggleArchive}
                        disabled={isArchiving}
                        className="flex-row items-center gap-two px-three py-two"
                      >
                        <Ionicons
                          name={isArchived ? "archive-outline" : "archive"}
                          color={isArchived ? theme.accent : theme.danger}
                          size={16}
                        />
                        <ThemedText
                          type="small"
                          themeColor={isArchived ? "accent" : "danger"}
                        >
                          {isArchived ? "Désarchiver" : "Archiver"}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          {isArchived && (
            <View className="mx-four mb-three flex-row items-center gap-two rounded-two border border-border bg-background-element dark:border-border-dark dark:bg-background-element-dark px-three py-two">
              <Ionicons name="archive" color={theme.textSecondary} size={14} />
              <ThemedText type="small" themeColor="textSecondary">
                Mission archivée {formatRelativeTime(mission!.archivedAt!)}
              </ThemedText>
            </View>
          )}

          {mission && (
            <View className="px-four mb-one">
              <View className="flex-row items-center gap-two">
                <View
                  className={[
                    "rounded-five border px-two py-half",
                    TONE_BG[STATUS_TONE[mission.status]],
                  ].join(" ")}
                >
                  <ThemedText
                    type="eyebrow"
                    themeColor={TONE_TEXT[STATUS_TONE[mission.status]] as any}
                  >
                    {STATUS_LABELS[mission.status]}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {MISSION_TYPE_LABELS[mission.missionType]}
                </ThemedText>
              </View>
            </View>
          )}

          {isLoading && (
            <ThemedText themeColor="textSecondary" className="px-four py-four">
              Chargement...
            </ThemedText>
          )}

          {loadError && !isLoading && (
            <ThemedText themeColor="danger" className="px-four py-four">
              {loadError}
            </ThemedText>
          )}

          {mission && !isLoading && (
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                className="flex-1"
                contentContainerClassName="px-four pb-40"
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
              >
                <StatusTimeline
                  currentStatus={mission.status}
                  isArchived={isArchived}
                />

                <View className="mt-six mb-three">
                  <SegmentedControl
                    options={TABS}
                    value={activeTab}
                    onChange={setActiveTab}
                  />
                </View>

                {activeTab === "infos" && (
                  <MissionInfoTab
                    mission={mission}
                    isArchived={isArchived}
                    onUpdate={isArchived ? undefined : handleUpdateInfo}
                    onBuildingsChange={handleBuildingsChange}
                  />
                )}

                {activeTab === "parties" && (
                  <MissionPartiesTab
                    missionId={mission.id}
                    isArchived={isArchived}
                  />
                )}

                {activeTab === "rdv" && (
                  <MissionRdvTab
                    missionId={mission.id}
                    isArchived={isArchived}
                  />
                )}

                {activeTab === "devis" && (
                  <MissionDevisTab mission={mission} isArchived={isArchived} />
                )}
              </ScrollView>

              {!isArchived && mission.status !== "ENVOYEE" && (
                <View className="border-t border-border px-four py-three dark:border-border-dark">
                  <PrimaryButton
                    label={STATUS_ACTION_LABEL[mission.status]}
                    onPress={handlePrimaryAction}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    loadingLabel="En cours..."
                  />
                </View>
              )}
            </KeyboardAvoidingView>
          )}
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
