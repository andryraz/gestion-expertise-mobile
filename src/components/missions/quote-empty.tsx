import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/auth/primary-button";
import { ThemedText } from "@/components/themed-text";
import { DEFAULT_CURRENCY } from "@/constants/quote-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { createQuote, updateQuote } from "@/services/quote-services";
import type { Quote } from "@/types/quote";
import { logger } from "@/utils/logger";

function guessMimeTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pdf":
    default:
      return "application/pdf";
  }
}

type QuoteCreateFormProps = {
  missionId: string;
  isArchived: boolean;
  onQuoteCreated: (quote: Quote) => void;
  editingQuote?: Quote | null;
  onEditDone?: () => void;
};

export function EmptyQuoteState({
  missionId,
  isArchived,
  onQuoteCreated,
  editingQuote,
  onEditDone,
}: QuoteCreateFormProps) {
  const theme = useTheme();
  const isEditing = !!editingQuote;

  const [amount, setAmount] = useState(
    editingQuote ? String(editingQuote.amount) : "",
  );
  const [currency, setCurrency] = useState(
    editingQuote?.currency ?? DEFAULT_CURRENCY,
  );
  const [description, setDescription] = useState(
    editingQuote?.description ?? "",
  );
  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(!!editingQuote?.description);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isArchived) {
    return (
      <View className="items-center py-six">
        <Ionicons
          name="document-outline"
          color={theme.textSecondary}
          size={32}
        />
        <ThemedText themeColor="textSecondary" className="mt-two text-center">
          Aucun devis pour le moment
        </ThemedText>
      </View>
    );
  }

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? guessMimeTypeFromName(asset.name),
        });
      }
    } catch (err) {
      logger.error("QuoteCreate", "Échec sélection document", err);
      const msg =
        err instanceof Error && err.message
          ? `Impossible de sélectionner le document (${err.message})`
          : "Impossible de sélectionner le document";
      Alert.alert("Erreur", msg);
    }
  };

  const handleSubmit = async () => {
    const num = Number(amount.replace(/\s/g, "").replace(",", "."));
    if (!num || num <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un montant valide");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingQuote) {
        const updated = await updateQuote(editingQuote.id, {
          amount: num,
          currency: currency.trim() || undefined,
          description: description.trim() || undefined,
        });
        onQuoteCreated(updated);
        onEditDone?.();
      } else {
        const quote = await createQuote(missionId, {
          amount: num,
          currency: currency.trim() || undefined,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(pickedFile ? { document: pickedFile } : {}),
        });
        onQuoteCreated(quote);
      }
    } catch (err) {
      logger.error(
        "QuoteCreate",
        isEditing ? "Échec modification devis" : "Échec création devis",
        err,
      );
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : isEditing
              ? "Impossible de modifier le devis"
              : "Impossible de créer le devis";
      Alert.alert("Erreur", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-three">
      {isEditing && (
        <ThemedText type="eyebrow" themeColor="accent" className="mb-one">
          Modifier le devis v{editingQuote.version}
        </ThemedText>
      )}

      {!isEditing && (
        <View>
          <ThemedText type="eyebrow" themeColor="accent" className="mb-one">
            Document
          </ThemedText>
          <Pressable
            onPress={handlePickDocument}
            disabled={isSubmitting}
            className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark px-three py-three"
          >
            <Ionicons
              name={pickedFile ? "document" : "document-outline"}
              color={pickedFile ? theme.accent : theme.textSecondary}
              size={20}
            />
            <View className="flex-1">
              {pickedFile ? (
                <ThemedText type="smallBold" numberOfLines={1}>
                  {pickedFile.name}
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Importer un document (PDF, Word)
                </ThemedText>
              )}
            </View>
            {pickedFile && (
              <Pressable onPress={() => setPickedFile(null)} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  color={theme.textSecondary}
                  size={18}
                />
              </Pressable>
            )}
          </Pressable>
        </View>
      )}

      <View>
        <ThemedText type="eyebrow" themeColor="accent" className="mb-one">
          Montant
        </ThemedText>
        <View className="flex-row gap-two">
          <View className="flex-[3]">
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
              className="rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark text-text dark:text-text-dark px-three py-three text-base font-semibold"
              editable={!isSubmitting}
            />
          </View>
          <View className="flex-1">
            <TextInput
              value={currency}
              onChangeText={setCurrency}
              placeholder="MGA"
              placeholderTextColor={theme.textSecondary}
              className="rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark text-text dark:text-text-dark px-three py-three text-base font-semibold text-center"
              editable={!isSubmitting}
              autoCapitalize="characters"
            />
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => setShowDetails(!showDetails)}
        hitSlop={8}
        className="flex-row items-center gap-one"
      >
        <Ionicons
          name={showDetails ? "chevron-down" : "chevron-forward"}
          color={theme.textSecondary}
          size={14}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {description ? "Modifier la description" : "Ajouter une description"}
        </ThemedText>
      </Pressable>

      {showDetails && (
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description optionnelle"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark text-text dark:text-text-dark px-three py-three text-base leading-6"
          editable={!isSubmitting}
        />
      )}

      <View className="flex-row gap-two">
        {isEditing && onEditDone && (
          <View className="flex-1">
            <PrimaryButton label="Annuler" onPress={onEditDone} />
          </View>
        )}
        <View
          className={isEditing ? "flex-[2]" : undefined}
          style={!isEditing ? { flex: 1 } : undefined}
        >
          <PrimaryButton
            label={isEditing ? "Enregistrer" : "Créer le devis"}
            onPress={handleSubmit}
            loading={isSubmitting}
            loadingLabel={isEditing ? "Enregistrement..." : "Création..."}
          />
        </View>
      </View>
    </View>
  );
}
