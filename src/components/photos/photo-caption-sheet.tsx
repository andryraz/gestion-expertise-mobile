import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useTheme } from "@/hooks/use-theme";
import { useUpdatePhoto } from "@/queries/photos";
import type { Photo } from "@/types/photo";
import { logger } from "@/utils/logger";
import { getPhotoUri } from "@/utils/photo-source";

type PhotoCaptionSheetProps = {
  /** Photo à légender (upload déjà effectué) — `null` ferme la feuille. */
  photo: Photo | null;
  onClose: () => void;
};

/**
 * Feuille modale légère (bottom-sheet) proposant une légende optionnelle
 * juste après la capture. Non bloquante : la photo est déjà envoyée, on ne
 * fait jamais attendre la légende — « Passer » ferme immédiatement et
 * l'expert peut enchaîner une nouvelle capture.
 */
export function PhotoCaptionSheet({ photo, onClose }: PhotoCaptionSheetProps) {
  // `key` : remonte le contenu à chaque nouvelle photo, le champ repart
  // donc vierge sans effet de synchronisation.
  if (!photo) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <PhotoCaptionSheetContent
        key={photo.id}
        photo={photo}
        onClose={onClose}
      />
    </Modal>
  );
}

type PhotoCaptionSheetContentProps = {
  photo: Photo;
  onClose: () => void;
};

function PhotoCaptionSheetContent({
  photo,
  onClose,
}: PhotoCaptionSheetContentProps) {
  const theme = useTheme();
  const updatePhotoMutation = useUpdatePhoto();

  const [caption, setCaption] = useState("");

  const canValidate = caption.trim().length > 0;

  /**
   * Envoi non bloquant : on déclenche le PATCH et on ferme aussitôt.
   * Le résultat (succès/échec) est tracé dans les logs ; les galeries se
   * resynchronisent via le cache React Query.
   */
  const handleValidate = () => {
    const trimmed = caption.trim();
    if (!trimmed) return;

    updatePhotoMutation.mutate(
      { photoId: photo.id, payload: { caption: trimmed } },
      {
        onSuccess: () =>
          logger.info("Photos", "Légende enregistrée", { photoId: photo.id }),
        onError: (err) =>
          logger.error(
            "Photos",
            "Échec de l'enregistrement de la légende",
            err instanceof Error ? err.message : err,
          ),
      },
    );
    onClose();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black/40"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Zone extérieure : toucher hors de la feuille = Passer */}
      <Pressable className="flex-1" onPress={onClose} />

      <View className="rounded-t-four border-t border-border dark:border-border-dark bg-background dark:bg-background-dark px-four pt-three pb-six">
        {/* Poignée de la feuille */}
        <View className="self-center h-one w-10 rounded-half bg-background-selected dark:bg-background-selected-dark" />

        <View className="mt-three flex-row items-center gap-two">
          <Image
            source={{ uri: getPhotoUri(photo) }}
            style={{ width: 56, height: 56, borderRadius: 8 }}
            contentFit="cover"
            transition={150}
          />
          <View className="flex-1">
            <ThemedText type="smallBold">Légende (optionnel)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Photo envoyée — tu peux enchaîner tes captures
            </ThemedText>
          </View>
        </View>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Ajouter une légende/observation..."
          placeholderTextColor={theme.textSecondary}
          className="mt-three rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium min-h-[100px]"
          autoCapitalize="sentences"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View className="mt-three flex-row gap-two">
          {/* « Passer » : aussi visible que « Valider », ferme sans rien envoyer */}
          <Pressable
            onPress={onClose}
            className="flex-1 items-center justify-center rounded-three border border-border dark:border-border-dark py-three active:opacity-85"
          >
            <ThemedText
              className="text-base leading-5 font-bold tracking-[0.5px] uppercase"
              themeColor="textSecondary"
            >
              Passer
            </ThemedText>
          </Pressable>
          <View className="flex-1">
            <PrimaryButton
              label="Valider"
              onPress={handleValidate}
              disabled={!canValidate}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
