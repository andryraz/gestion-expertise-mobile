import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaptureFab, PhotoViewerModal } from "@/components/photos";
import { PhotoGrid } from "@/components/photos/photo-thumbnail";
import { UnclassifiedPhotosSheet } from "@/components/photos/unclassified-photos-sheet";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  DISORDER_CATEGORY_LABELS,
  OBSERVATION_SEVERITY_BG,
  OBSERVATION_SEVERITY_LABELS,
  OBSERVATION_SEVERITY_TEXT_COLOR,
} from "@/constants/observation-labels";
import { ZONE_TYPE_ICONS } from "@/constants/zone-labels";
import { usePhotoCapture } from "@/hooks/use-photo-capture";
import { useTheme } from "@/hooks/use-theme";
import { useDisorderTypes } from "@/queries/disorder-types";
import { useDeleteObservation, useObservation } from "@/queries/observations";
import {
  useCreatePhoto,
  useMissionPhotos,
  useObservationPhotos,
} from "@/queries/photos";
import { ApiError } from "@/services/api-client";
import { usePendingPhotosStore } from "@/store/pending-photos-store";
import type { Photo } from "@/types/photo";
import { logger } from "@/utils/logger";

type ObservationDetailParams = {
  observationId: string;
  /** Requis pour l'upload photo (POST /missions/{missionId}/photos). */
  missionId?: string;
  /** Requis pour le classement des photos libres vers une zone. */
  buildingId?: string;
  missionStatus?: string;
};

/**
 * Fiche complète d'une observation. La capture photo hérite du contexte
 * zone : observation.zoneId est transmis automatiquement à l'upload,
 * jamais redemandé à l'utilisateur.
 */
export default function ObservationDetailScreen() {
  const params = useLocalSearchParams<ObservationDetailParams>();
  const { observationId, missionId, buildingId, missionStatus } = params;
  const theme = useTheme();

  const [viewedPhoto, setViewedPhoto] = useState<Photo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUnclassified, setShowUnclassified] = useState(false);

  const {
    data: observation,
    isLoading,
    error: queryError,
  } = useObservation(observationId);

  const { data: photos = [] } = useObservationPhotos(observationId);

  // Photos de la mission : pour le badge « Photos non classées » et la
  // feuille de classement, mêmes sources que l'écran mission.
  const { data: missionPhotos = [] } = useMissionPhotos(missionId ?? "");

  // Le backend peut ne pas inclure le type de désordre imbriqué dans le
  // détail : on retombe sur la liste complète (pas de pagination).
  const { data: allDisorderTypes = [] } = useDisorderTypes(
    !observation || observation.disorderType ? undefined : "",
  );
  const disorderType =
    observation?.disorderType ??
    allDisorderTypes.find(
      (type) => observation && type.id === observation.disorderTypeId,
    ) ??
    null;

  const createPhotoMutation = useCreatePhoto(missionId ?? "");
  const deleteObservationMutation = useDeleteObservation();
  const { capture, isCapturing } = usePhotoCapture();
  const addPending = usePendingPhotosStore((state) => state.addPending);

  const canCapture = !!missionId && missionStatus === "EN_COURS";

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
    if (!observation || !missionId) return;
    setUploadError(null);
    const uri = await capture();
    if (!uri) return;

    try {
      // Contexte zone hérité de l'observation : jamais redemandé.
      await createPhotoMutation.mutateAsync({
        uri,
        zoneId: observation.zoneId,
        observationId: observation.id,
      });
      logger.info("Photos", "Photo rattachée à l'observation", {
        observationId: observation.id,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'envoyer la photo. Vérifie ta connexion.";
      addPending({
        missionId,
        zoneId: observation.zoneId,
        observationId: observation.id,
        uri,
      });
      setUploadError(message);
      logger.error("Photos", "Échec upload photo observation", {
        observationId: observation.id,
        message,
      });
    }
  };

  const handleEdit = () => {
    if (!observation) return;
    router.push({
      pathname: "/observations/observation-form",
      params: { observationId: observation.id, mode: "edit" },
    });
  };

  const handleDelete = () => {
    if (!observation) return;
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
              logger.info("Observations", "Observation supprimée", {
                id: observation.id,
              });
              router.back();
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

  const loadError = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger l'observation"
    : null;

  if (isLoading) {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center gap-two px-four pt-three pb-four">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <ThemedText type="smallBold" className="text-xl flex-1">
              Observation
            </ThemedText>
          </View>
          <ThemedText themeColor="textSecondary" className="px-four py-four">
            Chargement...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!observation) {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center gap-two px-four pt-three pb-four">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <ThemedText type="smallBold" className="text-xl flex-1">
              Observation
            </ThemedText>
          </View>
          <ThemedText themeColor="danger" className="px-four py-four">
            {loadError ?? "Observation introuvable"}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <View className="flex-row items-center gap-two px-four pt-three pb-four">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <View className="flex-1">
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                className="text-base"
                numberOfLines={1}
              >
                {disorderType
                  ? DISORDER_CATEGORY_LABELS[disorderType.category]
                  : "Observation"}
              </ThemedText>
              <ThemedText
                type="smallBold"
                numberOfLines={2}
                className="text-xl leading-7"
              >
                {disorderType?.name ?? "Détail de l'observation"}
              </ThemedText>
            </View>
            <View className="flex-row items-center gap-two">
              {canCapture && (
                <Pressable
                  onPress={handleEdit}
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center rounded-five bg-accent/10"
                >
                  <Ionicons name="pencil" color={theme.accent} size={18} />
                </Pressable>
              )}
              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                disabled={deleteObservationMutation.isPending}
                className="h-9 w-9 items-center justify-center rounded-five bg-danger/10"
              >
                <Ionicons
                  name="trash-outline"
                  color={theme.danger}
                  size={18}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-four pb-40"
            showsVerticalScrollIndicator={false}
          >
            {/* Sévérité + date */}
            <View className="flex-row items-center gap-two mb-three">
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
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(observation.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </ThemedText>
            </View>

            {/* Zone de rattachement (contexte hérité, informatif) */}
            {observation.zone && (
              <ThemedView
                type="backgroundElement"
                className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark px-three py-two mb-three"
              >
                <Ionicons
                  name={ZONE_TYPE_ICONS[observation.zone.zoneType] ?? "location-outline"}
                  color={theme.textSecondary}
                  size={16}
                />
                <ThemedText type="small" className="flex-1" numberOfLines={1}>
                  {observation.zone.name}
                </ThemedText>
                <Ionicons
                  name="lock-closed-outline"
                  color={theme.textSecondary}
                  size={14}
                />
              </ThemedView>
            )}

            {/* Description */}
            <View className="mb-three">
              <ThemedText
                type="eyebrow"
                themeColor="accent"
                className="mb-two"
              >
                Description
              </ThemedText>
              <ThemedView
                type="backgroundElement"
                className="rounded-three border border-border dark:border-border-dark px-three py-two"
              >
                <ThemedText type="default">{observation.description}</ThemedText>
              </ThemedView>
            </View>

            {/* Cause probable */}
            <View className="mb-three">
              <ThemedText
                type="eyebrow"
                themeColor="accent"
                className="mb-two"
              >
                Cause probable
              </ThemedText>
              <ThemedView
                type="backgroundElement"
                className="rounded-three border border-border dark:border-border-dark px-three py-two"
              >
                <ThemedText
                  type="default"
                  themeColor={observation.probableCause ? "text" : "textSecondary"}
                >
                  {observation.probableCause ?? "Non renseignée"}
                </ThemedText>
              </ThemedView>
            </View>

            {/* Photos rattachées */}
            <View className="mb-four">
              <ThemedText
                type="eyebrow"
                themeColor="accent"
                className="mb-two"
              >
                Photos
              </ThemedText>
              <PhotoGrid
                photos={photos}
                size={84}
                emptyLabel="Aucune photo pour cette observation"
                onPhotoPress={setViewedPhoto}
              />
            </View>
          </ScrollView>

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
            missionId={missionId ?? ""}
            buildingId={buildingId ?? null}
            photos={missionPhotos}
            onClose={() => {
              setShowUnclassified(false);
              setUploadError(null);
            }}
          />

          <PhotoViewerModal
            photo={viewedPhoto}
            missionId={missionId ?? null}
            onClose={() => setViewedPhoto(null)}
          />
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
