import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/auth/primary-button";
import { QuoteCard } from "@/components/missions/quote-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  formatAmount,
  QUOTE_STATUS_BG,
  QUOTE_STATUS_FG,
} from "@/constants/quote-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { respondToQuote } from "@/services/quote-services";
import type { Quote, QuoteProposedBy } from "@/types/quote";

type AwaitingQuoteStateProps = {
  quotes: Quote[];
  missionId: string;
  isArchived: boolean;
  onQuoteUpdated: (quote: Quote) => void;
};

export function AwaitingQuoteState({
  quotes,
  missionId,
  isArchived,
  onQuoteUpdated,
}: AwaitingQuoteStateProps) {
  const theme = useTheme();
  const sorted = [...quotes].sort((a, b) => b.version - a.version);
  const active = sorted[0];

  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterProposedBy, setCounterProposedBy] = useState<QuoteProposedBy>(active.proposedBy === "EXPERT" ? "CLIENT" : "EXPERT");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (active) setCounterAmount(String(active.amount));
  }, [active?.id]);

  if (!active) return null;

  const handleAction = (action: "ACCEPTE" | "REFUSE") => {
    if (action === "REFUSE") {
      Alert.alert(
        "Refuser le devis",
        "Cette action est définitive. Le devis sera marqué comme refusé.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Refuser",
            style: "destructive",
            onPress: () => doRespond(action),
          },
        ],
      );
      return;
    }
    doRespond(action);
  };

  const doRespond = async (
    action: "ACCEPTE" | "REFUSE" | "CONTRE_PROPOSITION",
    amount?: number,
    description?: string,
    proposedBy?: QuoteProposedBy,
  ) => {
    setIsUpdating(true);
    try {
      const updated = await respondToQuote(missionId, active.id, {
        action,
        ...(amount !== undefined ? { amount } : {}),
        ...(description ? { description } : {}),
        ...(proposedBy ? { proposedBy } : {}),
      });
      onQuoteUpdated(updated);
      setShowCounter(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible de modifier le devis";
      Alert.alert("Erreur", msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCounter = () => {
    const num = Number(counterAmount.replace(/\s/g, "").replace(",", "."));
    if (!num || num <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un montant valide");
      return;
    }
    doRespond("CONTRE_PROPOSITION", num, undefined, counterProposedBy);
  };

  const isExpertProposed = active.proposedBy === "EXPERT";

  return (
    <View className="gap-three">
      <ThemedView
        type="backgroundElement"
        className="rounded-three border border-border dark:border-border-dark p-four"
      >
        <View className="flex-row items-center gap-two mb-two">
          <Ionicons name="document-text" color={theme.accent} size={16} />
          <ThemedText type="eyebrow" themeColor="accent">
            Devis actif
          </ThemedText>
        </View>

        <View className="items-center mb-two">
          <ThemedText
            type="subtitle"
            themeColor="accent"
            className="text-[40px] leading-[44px]"
          >
            {formatAmount(active.amount, active.currency)}
          </ThemedText>
          <View
            className={`mt-two rounded-five px-two py-half ${QUOTE_STATUS_BG[active.status]}`}
          >
            <ThemedText
              type="eyebrow"
              className={QUOTE_STATUS_FG[active.status]}
            >
              {isExpertProposed
                ? "Proposé par vous"
                : "Contre-proposition du client"}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <View>
        <ThemedText
          type="eyebrow"
          themeColor="textSecondary"
          className="mb-two px-one"
        >
          Historique de négociation
        </ThemedText>
        <View className="gap-two">
          {sorted.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              isExpert={q.proposedBy === "EXPERT"}
            />
          ))}
        </View>
      </View>

      {showCounter && (
        <ThemedView
          type="backgroundElement"
          className="rounded-three border border-border dark:border-border-dark p-three gap-two"
        >
          <View>
            <ThemedText type="eyebrow" themeColor="accent" className="mb-one">
              Proposé par
            </ThemedText>
            <View className="flex-row gap-two">
              {(["EXPERT", "CLIENT"] as QuoteProposedBy[]).map((who) => {
                const isActive = who === counterProposedBy;
                return (
                  <Pressable
                    key={who}
                    onPress={() => setCounterProposedBy(who)}
                    className={[
                      "flex-1 flex-row items-center justify-center gap-two rounded-three border px-three py-two",
                      isActive
                        ? "border-accent bg-accent"
                        : "border-border bg-background-element dark:border-border-dark dark:bg-background-element-dark",
                    ].join(" ")}
                  >
                    <Ionicons
                      name={who === "EXPERT" ? "person" : "people"}
                      size={14}
                      color={isActive ? theme.background : theme.textSecondary}
                    />
                    <ThemedText
                      type="smallBold"
                      themeColor={isActive ? "background" : "textSecondary"}
                    >
                      {who === "EXPERT" ? "Expert" : "Client"}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ThemedText type="smallBold">Nouveau montant</ThemedText>
          <TextInput
            value={counterAmount}
            onChangeText={setCounterAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textSecondary}
            className="rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark text-text dark:text-text-dark px-three py-three text-base font-semibold"
            editable={!isUpdating}
          />
          <View className="flex-row gap-two">
            <View className="flex-1">
              <PrimaryButton
                label="Annuler"
                onPress={() => {
                  setShowCounter(false);
                  setCounterAmount(String(active.amount));
                }}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label="Envoyer la contre-proposition"
                onPress={handleCounter}
                loading={isUpdating}
                loadingLabel="Envoi..."
              />
            </View>
          </View>
        </ThemedView>
      )}

      {!isArchived && !showCounter && (
        <View className="gap-two">
          {isUpdating ? (
            <View className="items-center py-two">
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <>
              <PrimaryButton
                label="Accepter"
                onPress={() => handleAction("ACCEPTE")}
              />
              <PrimaryButton
                label="Refuser"
                onPress={() => handleAction("REFUSE")}
              />
              <PrimaryButton
                label="Contre-proposer"
                onPress={() => setShowCounter(true)}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}
