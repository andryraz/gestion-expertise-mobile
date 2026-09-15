import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useDeletePhoto, useUpdatePhoto } from "@/queries/photos";
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
  const updatePhotoMutation = useUpdatePhoto();

  const [captionDraft, setCaptionDraft] = useState("");
  const savedCaptionRef = useRef("");
  const lastSyncedPhotoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!photo) {
      lastSyncedPhotoIdRef.current = null;
      return;
    }
    if (lastSyncedPhotoIdRef.current === photo.id) return;
    lastSyncedPhotoIdRef.current = photo.id;
    setCaptionDraft(photo.caption ?? "");
    savedCaptionRef.current = photo.caption ?? "";
  }, [photo]);

  if (!photo) return null;

  const pending = isPendingPhoto(photo);

  const handleClose = () => {
    if (!pending) handleSaveCaption();
    onClose();
  };

  const handleSaveCaption = () => {
    const trimmed = captionDraft.trim();
    if (trimmed === savedCaptionRef.current) return;

    const previous = savedCaptionRef.current;
    savedCaptionRef.current = trimmed;

    updatePhotoMutation.mutate(
      {
        photoId: photo.id,
        payload: { caption: trimmed || null },
      },
      {
        onSuccess: () =>
          logger.info("Photos", "Légende mise à jour", { photoId: photo.id }),
        onError: (err) => {
          savedCaptionRef.current = previous;
          const message =
            err instanceof ApiError
              ? err.message
              : "Impossible d'enregistrer la légende";
          Alert.alert("Erreur", message);
          logger.error("Photos", "Échec de l'enregistrement de la légende", {
            photoId: photo.id,
            message,
          });
        },
      },
    );
  };

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
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 bg-black/95">
          <View
            className="flex-row items-center gap-two px-four pb-two"
            style={{ paddingTop: 48 }}
          >
            <Pressable onPress={handleClose} hitSlop={8}>
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
            <Pressable
              onPress={handleDelete}
              hitSlop={10}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View className="h-9 w-9 items-center justify-center rounded-five bg-white/15">
                  <Ionicons name="trash-outline" color="white" size={18} />
                </View>
              )}
            </Pressable>
          </View>

          <Pressable className="flex-1" onPress={handleClose}>
            <Image
              source={{ uri: getPhotoUri(photo) }}
              style={{ flex: 1 }}
              contentFit="contain"
              transition={150}
            />
          </Pressable>

          <View className="gap-two px-four pb-six pt-two">
            {pending ? (
              <ThemedText
                type="small"
                themeColor="background"
                className="text-center opacity-70"
              >
                Légende modifiable une fois la photo envoyée
              </ThemedText>
            ) : (
              <View className="flex-row items-end gap-two">
                <TextInput
                  value={captionDraft}
                  onChangeText={setCaptionDraft}
                  onEndEditing={handleSaveCaption}
                  onBlur={handleSaveCaption}
                  placeholder="Ajouter une légende..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  className="flex-1 rounded-three border border-white/25 bg-white/10 px-three py-two text-base font-medium text-white min-h-[90px]"
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    handleSaveCaption();
                  }}
                  disabled={captionDraft.trim() === savedCaptionRef.current}
                  hitSlop={8}
                  className="h-10 w-10 items-center justify-center rounded-five bg-white/15 active:opacity-85 disabled:opacity-40"
                >
                  <Ionicons name="checkmark" color="white" size={20} />
                </Pressable>
              </View>
            )}
            <ThemedText
              type="small"
              themeColor="background"
              className="text-center opacity-70"
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
