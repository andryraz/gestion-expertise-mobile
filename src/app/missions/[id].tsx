import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MissionAppointmentTab,
  MissionInfoTab,
  MissionPartiesTab,
  MissionQuoteTab,
  SegmentedControl,
  StatusTimeline,
} from "@/components/missions";
import { CaptureFab } from "@/components/photos/capture-fab";
import { UnclassifiedPhotosSheet } from "@/components/photos/unclassified-photos-sheet";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
  MISSION_TYPE_LABELS,
  STATUS_ACTION_LABEL,
  STATUS_ADVANCE,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/constants/mission-labels";
import { usePhotoCapture } from "@/hooks/use-photo-capture";
import { useTheme } from "@/hooks/use-theme";
import { queryClient } from "@/lib/query-client";
import {
  missionsKeys,
  useMissionDetail,
  useRefreshMissionAfterExternalChange,
  useToggleMissionArchive,
  useUpdateMission,
  useUpdateMissionStatus,
} from "@/queries/missions";
import { useCreatePhoto, useMissionPhotos } from "@/queries/photos";
import { ApiError } from "@/services/api-client";
import { usePendingPhotosStore } from "@/store/pending-photos-store";
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

  const [activeTab, setActiveTab] = useState("infos");
  const [showMenu, setShowMenu] = useState(false);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: mission, isLoading, error: queryError } = useMissionDetail(id);
  const loadError = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger la mission"
    : null;

  const updateMissionMutation = useUpdateMission(id);
  const updateStatusMutation = useUpdateMissionStatus(id);
  const toggleArchiveMutation = useToggleMissionArchive(id);
  const refreshAfterExternalChange = useRefreshMissionAfterExternalChange(id);
  const { data: photos = [] } = useMissionPhotos(id);
  const createPhotoMutation = useCreatePhoto(id);
  const { capture, isCapturing } = usePhotoCapture();
  const addPending = usePendingPhotosStore((state) => state.addPending);

  const unclassifiedCount = useMemo(
    () =>
      photos.filter(
        (photo) =>
          !photo.zoneId &&
          !photo.observationId &&
          !photo.id.startsWith("pending-"),
      ).length,
    [photos],
  );

  const firstBuildingId = mission?.buildings?.[0]?.id ?? null;

  const handleCapture = async () => {
    setUploadError(null);
    const uri = await capture();
    if (!uri || !id) return;

    try {
      await createPhotoMutation.mutateAsync({ uri });
      logger.info("Photos", "Photo capturée (libre)", { missionId: id });
      setShowUnclassified(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'envoyer la photo. Vérifie ta connexion.";
      addPending({ missionId: id, zoneId: null, observationId: null, uri });
      setUploadError(message);
      setShowUnclassified(true);
      logger.error("Photos", "Échec upload photo libre", {
        missionId: id,
        message,
      });
    }
  };

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
            try {
              await toggleArchiveMutation.mutateAsync(isArchived);
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

    const currentStatus = mission.status;

    try {
      await updateStatusMutation.mutateAsync(next);
      logger.info("Missions", "Statut avancé", {
        id,
        from: currentStatus,
        to: next,
      });

      if (currentStatus === "BROUILLON") {
        setActiveTab("parties");
      } else if (currentStatus === "PRISE_DE_CONTACT") {
        setActiveTab("devis");
      }
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
    }
  };

  const handleUpdateInfo = async (payload: UpdateMissionPayload) => {
    if (!id) return;
    await updateMissionMutation.mutateAsync(payload);
    logger.info("Missions", "Informations mises à jour", { id });
  };

  const handleBuildingsChange = (buildings: Mission["buildings"]) => {
    queryClient.setQueryData<Mission>(missionsKeys.detail(id), (prev) =>
      prev ? { ...prev, buildings } : prev,
    );
  };

  const handleMissionChangedFromQuoteTab = useCallback(() => {
    refreshAfterExternalChange();
  }, [refreshAfterExternalChange]);

  const isSubmitting =
    updateStatusMutation.isPending || updateMissionMutation.isPending;

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
                        disabled={toggleArchiveMutation.isPending}
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
                  <MissionAppointmentTab
                    missionId={mission.id}
                    isArchived={isArchived}
                  />
                )}

                {activeTab === "devis" && (
                  <MissionQuoteTab
                    mission={mission}
                    isArchived={isArchived}
                    onMissionChanged={handleMissionChangedFromQuoteTab}
                  />
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

          {mission && !isArchived && mission.status === "EN_COURS" && (
            <>
              {uploadError && (
                <View className="absolute bottom-24 left-four right-four rounded-three border border-danger/40 bg-danger/10 px-three py-two">
                  <View className="flex-row items-center gap-two">
                    <Ionicons
                      name="cloud-offline-outline"
                      color={theme.danger}
                      size={16}
                    />
                    <ThemedText
                      type="small"
                      themeColor="danger"
                      className="flex-1"
                    >
                      {uploadError} La photo reste enregistrée dans « Photos non
                      classées ».
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setUploadError(null)}
                    className="mt-one self-end"
                    hitSlop={8}
                  >
                    <ThemedText type="smallBold" themeColor="danger">
                      Fermer
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              <CaptureFab
                onPress={handleCapture}
                onLongPress={() => setShowUnclassified(true)}
                badgeCount={unclassifiedCount}
                disabled={isCapturing || createPhotoMutation.isPending}
              />

              <UnclassifiedPhotosSheet
                visible={showUnclassified}
                missionId={id}
                buildingId={firstBuildingId}
                photos={photos}
                onClose={() => {
                  setShowUnclassified(false);
                  setUploadError(null);
                }}
              />
            </>
          )}
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
