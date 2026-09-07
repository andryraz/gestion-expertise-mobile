import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, View } from "react-native";

import { PhotoAttachModal } from "@/components/photos/photo-attach-modal";
import { PhotoViewerModal } from "@/components/photos/photo-viewer-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useTheme } from "@/hooks/use-theme";
import { useAttachPhoto, useCreatePhoto } from "@/queries/photos";
import { ApiError } from "@/services/api-client";
import { usePendingPhotosStore } from "@/store/pending-photos-store";
import type { Photo } from "@/types/photo";
import { logger } from "@/utils/logger";
import { getPhotoUri } from "@/utils/photo-source";

type UnclassifiedPhotosSheetProps = {
  visible: boolean;
  missionId: string;
  buildingId: string | null;
  photos: Photo[];
  onClose: () => void;
};

export function UnclassifiedPhotosSheet({
  visible,
  missionId,
  buildingId,
  photos,
  onClose,
}: UnclassifiedPhotosSheetProps) {
  const theme = useTheme();

  const [attachTarget, setAttachTarget] = useState<Photo | null>(null);
  const [viewedPhoto, setViewedPhoto] = useState<Photo | null>(null);

  const attachMutation = useAttachPhoto(missionId);
  const createPhotoMutation = useCreatePhoto(missionId);
  const pending = usePendingPhotosStore((state) => state.pending);
  const removePending = usePendingPhotosStore((state) => state.removePending);

  const unclassified = photos.filter(
    (photo) =>
      !photo.zoneId && !photo.observationId && !photo.id.startsWith("pending-"),
  );

  const missionPending = pending.filter((p) => p.missionId === missionId);

  const handleRetry = async (pendingPhoto: (typeof pending)[number]) => {
    try {
      await createPhotoMutation.mutateAsync({
        uri: pendingPhoto.uri,
        zoneId: pendingPhoto.zoneId,
        observationId: pendingPhoto.observationId,
      });
      removePending(pendingPhoto.localId);
      logger.info("Photos", "Upload relancé avec succès", {
        localId: pendingPhoto.localId,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'envoyer la photo. Vérifie ta connexion.";
      Alert.alert("Échec de l'envoi", message);
      logger.error("Photos", "Nouvel échec d'upload", {
        localId: pendingPhoto.localId,
        message,
      });
    }
  };

  const handleAttach = async (zoneId: string, observationId: string | null) => {
    if (!attachTarget) return;
    try {
      await attachMutation.mutateAsync({
        photoId: attachTarget.id,
        payload: { zoneId, observationId },
      });
      logger.info("Photos", "Photo classée", {
        photoId: attachTarget.id,
        zoneId,
        observationId,
      });
      setAttachTarget(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de rattacher la photo";
      Alert.alert("Erreur", message);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ThemedView className="flex-1">
          <View className="flex-row items-center gap-two px-four pt-four pb-two">
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <View className="flex-1">
              <ThemedText
                type="smallBold"
                className="text-xl"
                themeColor="accent"
              >
                Photos non classées
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {unclassified.length > 0
                  ? `${unclassified.length} photo${unclassified.length > 1 ? "s" : ""} à rattacher à une zone`
                  : "Tout est classé, bravo !"}
              </ThemedText>
            </View>
          </View>

          {unclassified.length === 0 && missionPending.length === 0 ? (
            <View className="items-center px-four py-six">
              <Ionicons
                name="checkmark-done-circle-outline"
                color={theme.success}
                size={32}
              />
              <ThemedText
                themeColor="textSecondary"
                className="mt-two text-center"
              >
                Aucune photo en attente de classement
              </ThemedText>
            </View>
          ) : (
            <View className="flex-1 px-four pt-two">
              {missionPending.map((pendingPhoto) => (
                <View
                  key={pendingPhoto.localId}
                  className="flex-row items-center gap-two rounded-three border border-danger/40 bg-danger/5 px-two py-two mb-two"
                >
                  <Image
                    source={{ uri: pendingPhoto.uri }}
                    style={{ width: 56, height: 56, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 gap-half">
                    <ThemedText type="smallBold" themeColor="danger">
                      Envoi échoué
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={2}
                    >
                      La photo reste enregistrée sur l&apos;appareil — tu peux
                      la renvoyer sans la reprendre.
                    </ThemedText>
                  </View>
                  <PrimaryButton
                    label="Réessayer"
                    onPress={() => handleRetry(pendingPhoto)}
                    loading={createPhotoMutation.isPending}
                    loadingLabel="Envoi..."
                  />
                </View>
              ))}

              {unclassified.map((photo) => (
                <View
                  key={photo.id}
                  className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark px-two py-two mb-two"
                >
                  <Pressable
                    onPress={() => setViewedPhoto(photo)}
                    className="flex-row flex-1 items-center gap-two"
                  >
                    <Image
                      source={{ uri: getPhotoUri(photo) }}
                      style={{ width: 56, height: 56, borderRadius: 8 }}
                      contentFit="cover"
                      transition={150}
                    />
                    <View className="flex-1">
                      <ThemedText type="smallBold">
                        {photo.caption ?? "Sans légende"}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Photo libre — non rattachée
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setAttachTarget(photo)}
                    disabled={attachMutation.isPending}
                    className="flex-row items-center gap-one rounded-three bg-accent px-three py-two active:opacity-85"
                  >
                    {attachMutation.isPending ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.background}
                      />
                    ) : (
                      <Ionicons
                        name="link"
                        color={theme.background}
                        size={14}
                      />
                    )}
                    <ThemedText type="smallBold" themeColor="background">
                      Classer
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>
      </Modal>

      <PhotoAttachModal
        visible={!!attachTarget}
        buildingId={buildingId}
        isAttaching={attachMutation.isPending}
        onClose={() => setAttachTarget(null)}
        onAttach={handleAttach}
      />

      <PhotoViewerModal
        photo={viewedPhoto}
        missionId={missionId}
        onClose={() => setViewedPhoto(null)}
      />
    </>
  );
}
