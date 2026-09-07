import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaptureFab } from "@/components/photos";
import { PhotoViewerModal } from "@/components/photos/photo-viewer-modal";
import { PhotoGrid } from "@/components/photos/photo-thumbnail";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
  OBSERVATION_SEVERITY_LABELS,
  OBSERVATION_SEVERITY_TONE,
} from "@/constants/observation-labels";
import { ZONE_TYPE_ICONS, ZONE_TYPE_LABELS } from "@/constants/zone-labels";
import { usePhotoCapture } from "@/hooks/use-photo-capture";
import { useTheme } from "@/hooks/use-theme";
import { useZoneObservations } from "@/queries/observations";
import { useCreatePhoto, useZonePhotos } from "@/queries/photos";
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

const SEVERITY_BG: Record<string, string> = {
  muted: "bg-background-selected dark:bg-background-selected-dark",
  accent: "bg-accent",
  danger: "bg-danger dark:bg-danger-dark",
};

const SEVERITY_TEXT: Record<string, "textSecondary" | "background"> = {
  muted: "textSecondary",
  accent: "background",
  danger: "background",
};

function ObservationRow({ observation }: { observation: Observation }) {
  const theme = useTheme();
  const tone = OBSERVATION_SEVERITY_TONE[observation.severity];

  return (
    <View className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark px-three py-two">
      <View className="flex-row items-center gap-two">
        <View
          className={["rounded-five px-two py-half", SEVERITY_BG[tone]].join(
            " ",
          )}
        >
          <ThemedText type="eyebrow" themeColor={SEVERITY_TEXT[tone]}>
            {OBSERVATION_SEVERITY_LABELS[observation.severity]}
          </ThemedText>
        </View>
        <Ionicons
          name="alert-circle-outline"
          color={theme.textSecondary}
          size={14}
        />
      </View>
      <ThemedText type="default" className="mt-one" numberOfLines={3}>
        {observation.description}
      </ThemedText>
    </View>
  );
}

export default function ZoneDetailScreen() {
  const params = useLocalSearchParams<ZoneDetailParams>();
  const { buildingId, missionId, zoneId, missionStatus } = params;
  const theme = useTheme();

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

  const {
    data: observations = [],
    isLoading: isLoadingObservations,
    error: observationsError,
  } = useZoneObservations(zoneId);

  const createPhotoMutation = useCreatePhoto(missionId);
  const { capture, isCapturing } = usePhotoCapture();

  const isLoading = isLoadingTree || isLoadingPhotos || isLoadingObservations;

  const canCapture = missionStatus === "EN_COURS";

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

  const renderError = (err: unknown, label: string) =>
    err ? (
      <ThemedText themeColor="danger" type="small" className="py-two">
        {err instanceof ApiError ? err.message : label}
      </ThemedText>
    ) : null;

  const directChildren = node?.children ?? [];

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
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-four pb-40"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-four">
                <ThemedText
                  type="eyebrow"
                  themeColor="accent"
                  className="mb-two"
                >
                  Sous-zones
                </ThemedText>
                {directChildren.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Aucune sous-zone
                  </ThemedText>
                ) : (
                  <View className="gap-one">
                    {directChildren.map((child) => (
                      <Pressable
                        key={child.id}
                        onPress={() =>
                          router.push({
                            pathname: "/zones/[zoneId]" as any,
                            params: {
                              buildingId,
                              missionId,
                              zoneId: child.id,
                              missionStatus,
                            },
                          })
                        }
                        className="flex-row items-center gap-two rounded-two bg-background-element dark:bg-background-element-dark px-three py-two active:opacity-70"
                      >
                        <Ionicons
                          name={ZONE_TYPE_ICONS[child.zoneType]}
                          color={theme.textSecondary}
                          size={16}
                        />
                        <ThemedText type="smallBold" className="flex-1">
                          {child.name}
                        </ThemedText>
                        <Ionicons
                          name="chevron-forward"
                          color={theme.textSecondary}
                          size={14}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View className="mb-four">
                <ThemedText
                  type="eyebrow"
                  themeColor="accent"
                  className="mb-two"
                >
                  Photos
                </ThemedText>
                {renderError(photosError, "Impossible de charger les photos")}
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
                      disabled={isCapturing || createPhotoMutation.isPending}
                      loading={createPhotoMutation.isPending}
                      loadingLabel="Envoi..."
                    />
                  </View>
                )}

                <PhotoViewerModal
                  photo={viewedPhoto}
                  missionId={missionId}
                  onClose={() => setViewedPhoto(null)}
                />
              </View>

              <View className="mb-four">
                <ThemedText
                  type="eyebrow"
                  themeColor="accent"
                  className="mb-two"
                >
                  Observations
                </ThemedText>
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
                      />
                    ))}
                  </View>
                )}
              </View>

              <View className="mb-four">
                <ThemedText
                  type="eyebrow"
                  themeColor="accent"
                  className="mb-two"
                >
                  Mesures
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Les mesures seront disponibles prochainement.
                </ThemedText>
              </View>
            </ScrollView>
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
              disabled={isCapturing || createPhotoMutation.isPending}
            />
          )}
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
