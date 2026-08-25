import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/auth/primary-button";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { createQuote } from "@/services/quote-services";
import { DEFAULT_CURRENCY } from "@/constants/quote-labels";
import type { Quote } from "@/types/quote";

type EmptyQuoteStateProps = {
  missionId: string;
  isArchived: boolean;
  onQuoteCreated: (quote: Quote) => void;
};

export function EmptyQuoteState({
  missionId,
  isArchived,
  onQuoteCreated,
}: EmptyQuoteStateProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);
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

  const handleCreate = async (proposedBy: "EXPERT" | "CLIENT") => {
    const num = Number(amount.replace(/\s/g, "").replace(",", "."));
    if (!num || num <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un montant valide");
      return;
    }
    setIsSubmitting(true);
    try {
      const quote = await createQuote(missionId, {
        amount: num,
        currency,
        ...(description.trim() ? { description: description.trim() } : {}),
        proposedBy,
        status: "ENVOYE",
      });
      onQuoteCreated(quote);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Impossible de créer le devis";
      Alert.alert("Erreur", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-three">
      <View>
        <ThemedText type="eyebrow" themeColor="accent" className="mb-one">
          Montant à proposer
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
          Ajouter un détail
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

      {!isSubmitting && (
        <View className="gap-two">
          <PrimaryButton
            label="Envoyer au client"
            icon="send"
            onPress={() => handleCreate("EXPERT")}
          />
          <PrimaryButton
            label="Accepté immédiatement"
            icon="checkmark-circle"
            onPress={() => handleCreate("EXPERT")}
          />
        </View>
      )}
    </View>
  );
}
