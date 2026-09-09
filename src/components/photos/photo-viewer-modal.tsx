import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useDeletePhoto } from "@/queries/photos";
import { ApiError } from "@/services/api-client";
import type { Photo } from "@/types/photo";
import { logger } from "@/utils/logger";
import { getPhotoUri, isPendingPhoto } from "@/utils/photo-source";

type PhotoViewerModalProps = {
  photo: Photo | null;
  missionId: string | null;
  onClose: () => void;
};

export function PhotoViewerModal({
  photo,
  missionId,
  onClose,
}: PhotoViewerModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useDeletePhoto(missionId ?? "");

  if (!photo) return null;

  const pending = isPendingPhoto(photo);

  const handleDelete = () => {
    if (pending) {
      Alert.alert(
        "Photo non envoyée",
        "Cette photo n'a jamais été envoyée au serveur. Utilise « Réessayer » dans la liste pour la renvoyer.",
        [{ text: "OK", style: "cancel" }],
      );
      return;
    }

    Alert.alert(
      "Supprimer la photo",
      "Cette action est définitive. Supprimer cette photo ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!missionId) return;
            setIsDeleting(true);
            try {
              await deleteMutation.mutateAsync(photo.id);
              logger.info("Photos", "Photo supprimée depuis l'aperçu", {
                photoId: photo.id,
              });
              onClose();
            } catch (err) {
              const message =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de supprimer la photo";
              Alert.alert("Erreur", message);
              logger.error("Photos", "Échec suppression photo", {
                photoId: photo.id,
                message,
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={!!photo}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-black/95">
        <View
          className="flex-row items-center gap-two px-four pb-two"
          style={{ paddingTop: 48 }}
        >
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="chevron-back" color="white" size={26} />
          </Pressable>
          <ThemedText
            type="smallBold"
            className="flex-1 text-base"
            themeColor="background"
            numberOfLines={1}
          >
            {photo.caption ?? "Aperçu de la photo"}
          </ThemedText>
          <Pressable onPress={handleDelete} hitSlop={10} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View className="h-9 w-9 items-center justify-center rounded-five bg-white/15">
                <Ionicons name="trash-outline" color="white" size={18} />
              </View>
            )}
          </Pressable>
        </View>

        <Pressable className="flex-1" onPress={onClose}>
          <Image
            source={{ uri: getPhotoUri(photo) }}
            style={{ flex: 1 }}
            contentFit="contain"
            transition={150}
          />
        </Pressable>

        <View className="items-center px-four pb-six pt-two">
          <ThemedText
            type="small"
            themeColor="background"
            className="opacity-70"
          >
            {pending
              ? "Photo locale — envoi en attente"
              : `Prise le ${new Date(photo.takenAt).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  },
                )}`}
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}
