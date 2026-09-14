import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SegmentedControl,
  type TabOption,
} from "@/components/missions/segmented-control";
import { CaptureFab } from "@/components/photos";
import { PhotoGrid } from "@/components/photos/photo-thumbnail";
import { PhotoViewerModal } from "@/components/photos/photo-viewer-modal";
import { UnclassifiedPhotosSheet } from "@/components/photos/unclassified-photos-sheet";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ZoneTechnicalSheetSection } from "@/components/zones/zone-technical-sheet-section";
import {
  OBSERVATION_SEVERITY_BG,
  OBSERVATION_SEVERITY_LABELS,
  OBSERVATION_SEVERITY_TEXT_COLOR,
} from "@/constants/observation-labels";
import { ZONE_TYPE_ICONS, ZONE_TYPE_LABELS } from "@/constants/zone-labels";
import { usePhotoCapture } from "@/hooks/use-photo-capture";
import { useTheme } from "@/hooks/use-theme";
import {
  useDeleteObservation,
  useZoneObservations,
} from "@/queries/observations";
import {
  useCreatePhoto,
  useMissionPhotos,
  useZonePhotos,
} from "@/queries/photos";
import { useZonesTree } from "@/queries/zones";
import { ApiError } from "@/services/api-client";
import { usePendingPhotosStore } from "@/store/pending-photos-store";
import type { Observation } from "@/types/observation";
import type { Photo } from "@/types/photo";
import { logger } from "@/utils/logger";
import { findZoneNode } from "@/utils/zone-tree";

type ZoneDetailParams = {
  buildingId: string;
  missionId: string;
  zoneId: string;
  missionStatus?: string;
};

type ZoneTabKey = "fiche" | "observations" | "photos" | "mesures";

const ZONE_TABS: TabOption[] = [
  { key: "fiche", label: "Fiche" },
  { key: "observations", label: "Observations" },
  { key: "photos", label: "Photos" },
  { key: "mesures", label: "Mesures", disabled: true },
];

function ObservationRow({
  observation,
  onPress,
  onDelete,
}: {
  observation: Observation;
  onPress: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark px-three py-two active:opacity-80"
    >
      <View
        className={[
          "rounded-five px-two py-half",
          OBSERVATION_SEVERITY_BG[observation.severity],
        ].join(" ")}
      >
        <ThemedText
          type="eyebrow"
          themeColor={OBSERVATION_SEVERITY_TEXT_COLOR[observation.severity]}
        >
          {OBSERVATION_SEVERITY_LABELS[observation.severity]}
        </ThemedText>
      </View>
      <ThemedText type="default" className="flex-1" numberOfLines={3}>
        {observation.description}
      </ThemedText>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" color={theme.danger} size={18} />
      </Pressable>
      <Ionicons name="chevron-forward" color={theme.textSecondary} size={14} />
    </Pressable>
  );
}

export default function ZoneDetailScreen() {
  const params = useLocalSearchParams<ZoneDetailParams>();
  const { buildingId, missionId, zoneId, missionStatus } = params;
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<ZoneTabKey>("fiche");
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewedPhoto, setViewedPhoto] = useState<Photo | null>(null);

  const addPending = usePendingPhotosStore((state) => state.addPending);

  const {
    data: tree = [],
    isLoading: isLoadingTree,
    error: treeError,
  } = useZonesTree(buildingId);

  const node = findZoneNode(tree, zoneId);

  const {
    data: photos = [],
    isLoading: isLoadingPhotos,
    error: photosError,
  } = useZonePhotos(zoneId);

  // Photos de la mission : pour le badge « Photos non classées » et la
  // feuille de classement, mêmes sources que l'écran mission.
  const { data: missionPhotos = [] } = useMissionPhotos(missionId);

  const {
    data: observations = [],
    isLoading: isLoadingObservations,
    error: observationsError,
  } = useZoneObservations(zoneId);

  const createPhotoMutation = useCreatePhoto(missionId);
  const deleteObservationMutation = useDeleteObservation();
  const { capture, isCapturing } = usePhotoCapture();

  const isLoading = isLoadingTree || isLoadingPhotos || isLoadingObservations;

  const canCapture = missionStatus === "EN_COURS";

  const unclassifiedCount = useMemo(
    () =>
      missionPhotos.filter(
        (photo) =>
          !photo.zoneId &&
          !photo.observationId &&
          !photo.id.startsWith("pending-"),
      ).length,
    [missionPhotos],
  );

  const handleCapture = async () => {
    setUploadError(null);
    const uri = await capture();
    if (!uri) return;

    try {
      await createPhotoMutation.mutateAsync({ uri, zoneId });
      logger.info("Photos", "Photo rattachée à la zone", { zoneId });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'envoyer la photo. Vérifie ta connexion.";
      addPending({ missionId, zoneId, observationId: null, uri });
      setUploadError(message);
      logger.error("Photos", "Échec upload photo zone", { zoneId, message });
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    setViewedPhoto(photo);
  };

  const handleObservationPress = (observation: Observation) => {
    router.push({
      pathname: "/observations/[observationId]",
      params: {
        observationId: observation.id,
        buildingId,
        missionId,
        missionStatus,
      },
    });
  };

  const handleDeleteObservation = (observation: Observation) => {
    Alert.alert(
      "Supprimer l'observation",
      "Les photos et mesures liées seront détachées mais conservées. Cette action est définitive.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteObservationMutation.mutateAsync(observation.id);
              logger.info(
                "Observations",
                "Observation supprimée depuis la zone",
                {
                  id: observation.id,
                  zoneId,
                },
              );
            } catch (err) {
              const message =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de supprimer l'observation";
              Alert.alert("Erreur", message);
              logger.error(
                "Observations",
                "Échec de suppression d'observation",
                { id: observation.id, message },
              );
            }
          },
        },
      ],
    );
  };

  const handleCreateObservation = () => {
    router.push({
      pathname: "/observations/observation-form",
      params: { zoneId, zoneName: node?.name },
    });
  };

  const renderError = (err: unknown, label: string) =>
    err ? (
      <ThemedText themeColor="danger" type="small" className="py-two">
        {err instanceof ApiError ? err.message : label}
      </ThemedText>
    ) : null;

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <View className="flex-row items-center gap-two px-four pt-three pb-four">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <View className="flex-row items-center gap-two flex-1">
              {node && (
                <View className="h-9 w-9 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
                  <Ionicons
                    name={ZONE_TYPE_ICONS[node.zoneType]}
                    color={theme.accent}
                    size={16}
                  />
                </View>
              )}
              <View className="flex-1">
                <ThemedText
                  type="smallBold"
                  themeColor="textSecondary"
                  className="text-base"
                  numberOfLines={1}
                >
                  {node ? ZONE_TYPE_LABELS[node.zoneType] : "Zone"}
                </ThemedText>
                <ThemedText
                  type="smallBold"
                  numberOfLines={2}
                  className="text-xl leading-7"
                >
                  {node?.name ?? "Zone"}
                </ThemedText>
              </View>
            </View>
          </View>

          {isLoading && (
            <ThemedText themeColor="textSecondary" className="px-four py-four">
              Chargement...
            </ThemedText>
          )}

          {renderError(treeError, "Impossible de charger la zone")}

          {node && !isLoadingTree && (
            <>
              <View className="pb-three">
                <SegmentedControl
                  options={ZONE_TABS}
                  value={activeTab}
                  onChange={(key) => setActiveTab(key as ZoneTabKey)}
                />
              </View>

              <ScrollView
                className="flex-1"
                contentContainerClassName="px-four pb-40"
                showsVerticalScrollIndicator={false}
              >
                {activeTab === "fiche" && (
                  <ZoneTechnicalSheetSection
                    zoneId={zoneId}
                    buildingId={buildingId}
                    missionStatus={missionStatus}
                  />
                )}

                {activeTab === "photos" && (
                  <View className="mb-four">
                    {renderError(
                      photosError,
                      "Impossible de charger les photos",
                    )}
                    {isLoadingPhotos ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        Chargement...
                      </ThemedText>
                    ) : (
                      <PhotoGrid
                        photos={photos}
                        emptyLabel="Aucune photo pour cette zone"
                        onPhotoPress={handlePhotoPress}
                      />
                    )}
                    {canCapture && (
                      <View className="mt-two">
                        <PrimaryButton
                          label="Capturer une photo ici"
                          icon="camera-outline"
                          onPress={handleCapture}
                          disabled={
                            isCapturing || createPhotoMutation.isPending
                          }
                          loading={createPhotoMutation.isPending}
                          loadingLabel="Envoi..."
                        />
                      </View>
                    )}
                  </View>
                )}

                {activeTab === "observations" && (
                  <View className="mb-four">
                    {renderError(
                      observationsError,
                      "Impossible de charger les observations",
                    )}
                    {isLoadingObservations ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        Chargement...
                      </ThemedText>
                    ) : observations.length === 0 ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        Aucune observation sur cette zone
                      </ThemedText>
                    ) : (
                      <View className="gap-two">
                        {observations.map((observation) => (
                          <ObservationRow
                            key={observation.id}
                            observation={observation}
                            onPress={() => handleObservationPress(observation)}
                            onDelete={() =>
                              handleDeleteObservation(observation)
                            }
                          />
                        ))}
                      </View>
                    )}
                    {canCapture && (
                      <View className="mt-two">
                        <PrimaryButton
                          label="Ajouter une observation"
                          icon="add-circle-outline"
                          onPress={handleCreateObservation}
                        />
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </>
          )}

          {uploadError && (
            <View className="absolute bottom-24 left-four right-four rounded-three border border-danger/40 bg-danger/10 px-three py-two">
              <View className="flex-row items-center gap-two">
                <Ionicons
                  name="cloud-offline-outline"
                  color={theme.danger}
                  size={16}
                />
                <ThemedText type="small" themeColor="danger" className="flex-1">
                  {uploadError} La photo reste enregistrée dans « Photos non
                  classées » de la mission.
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

          {canCapture && (
            <CaptureFab
              onPress={handleCapture}
              onLongPress={() => setShowUnclassified(true)}
              badgeCount={unclassifiedCount}
              disabled={isCapturing || createPhotoMutation.isPending}
            />
          )}

          <UnclassifiedPhotosSheet
            visible={showUnclassified}
            missionId={missionId}
            buildingId={buildingId}
            photos={missionPhotos}
            onClose={() => {
              setShowUnclassified(false);
              setUploadError(null);
            }}
          />

          <PhotoViewerModal
            photo={viewedPhoto}
            missionId={missionId}
            onClose={() => setViewedPhoto(null)}
          />
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
