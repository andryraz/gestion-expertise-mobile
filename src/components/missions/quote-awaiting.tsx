import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as MailComposer from "expo-mail-composer";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { PrimaryButton } from "@/components/auth/primary-button";
import { EmptyQuoteState } from "@/components/missions/quote-empty";
import { QuoteHistory } from "@/components/missions/quote-history";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  formatAmount,
  QUOTE_STATUS_BG,
  QUOTE_STATUS_FG,
  QUOTE_STATUS_LABELS,
} from "@/constants/quote-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import {
  acceptQuote,
  deleteQuote,
  getDocumentDownloadUrl,
  markQuoteSent,
  refuseQuote,
} from "@/services/quote-services";
import { getToken } from "@/services/token-storage";
import type { Quote } from "@/types/quote";
import { formatQuoteDateTime } from "@/utils/format-quote-date";
import { logger } from "@/utils/logger";

type AwaitingQuoteStateProps = {
  activeQuote: Quote;
  historyQuotes: Quote[];
  missionId: string;
  isArchived: boolean;
  onRefresh: () => void;
  onMissionChanged: () => void;
};

export function AwaitingQuoteState({
  activeQuote,
  historyQuotes,
  missionId,
  isArchived,
  onRefresh,
  onMissionChanged,
}: AwaitingQuoteStateProps) {
  const theme = useTheme();
  const [isWorking, setIsWorking] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isBrouillon = activeQuote.status === "BROUILLON";
  const isEnvoye = activeQuote.status === "ENVOYE";
  const hasDocument = !!activeQuote.documentPath;

  /* ── Email sending flow ── */
  const handleSendEmail = async () => {
    if (!hasDocument) {
      Alert.alert(
        "Aucun document",
        "Veuillez d'abord importer un document PDF ou Word avant d'envoyer le devis.",
      );
      return;
    }

    setIsWorking(true);
    try {
      // 1. Download document locally
      // Le token doit passer par le header Authorization (comme partout
      // ailleurs dans l'app) et non en query string — c'est ce qui causait
      // le 401 ici.
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const downloadUrl = await getDocumentDownloadUrl(activeQuote.id);
      const destFile = new File(
        Paths.cache,
        activeQuote.documentFileName ?? "devis.pdf",
      );
      const task = File.createDownloadTask(downloadUrl, destFile, { headers });
      const downloaded = await task.downloadAsync();
      if (!downloaded) {
        throw new Error("Téléchargement interrompu");
      }
      const uri = downloaded.uri;

      // 2. Open mail composer with the file
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Email indisponible",
          "Aucune application de messagerie configurée sur cet appareil.",
        );
        return;
      }

      await MailComposer.composeAsync({
        subject: `Devis v${activeQuote.version} — ${formatAmount(activeQuote.amount, activeQuote.currency)}`,
        body: "",
        attachments: [uri],
      });

      // 3. Ask confirmation before marking as sent
      Alert.alert(
        "Devis envoyé ?",
        "Avez-vous bien transmis le devis par email ?",
        [
          { text: "Non, annuler", style: "cancel" },
          {
            text: "Oui, envoyé",
            onPress: async () => {
              try {
                await markQuoteSent(activeQuote.id);
                onRefresh();
              } catch (err) {
                const msg =
                  err instanceof ApiError
                    ? err.message
                    : "Erreur lors de la validation";
                Alert.alert("Erreur", msg);
              }
            },
          },
        ],
      );
    } catch (err) {
      if (err instanceof Error && err.message?.includes("canceled")) {
        // User cancelled mail composer — do nothing
        return;
      }
      logger.error(
        "QuoteSend",
        "Échec envoi devis par email",
        err instanceof Error ? `${err.name}: ${err.message}` : err,
      );
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : "Impossible d'envoyer le devis";
      Alert.alert("Erreur", msg);
    } finally {
      setIsWorking(false);
    }
  };

  /* ── Accept ── */
  const handleAccept = async () => {
    setIsWorking(true);
    try {
      await acceptQuote(activeQuote.id);
      onRefresh();
      onMissionChanged();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible d'accepter le devis";
      Alert.alert("Erreur", msg);
    } finally {
      setIsWorking(false);
    }
  };

  /* ── Refuse ── */
  const handleRefuse = () => {
    Alert.alert(
      "Refuser le devis",
      "Le devis sera marqué comme refusé et la mission passera en statut Refusée.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser",
          style: "destructive",
          onPress: async () => {
            setIsWorking(true);
            try {
              await refuseQuote(activeQuote.id);
              onRefresh();
              onMissionChanged();
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de refuser le devis";
              Alert.alert("Erreur", msg);
            } finally {
              setIsWorking(false);
            }
          },
        },
      ],
    );
  };

  /* ── Delete ── */
  const handleDelete = () => {
    Alert.alert("Supprimer ce devis ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setIsWorking(true);
          try {
            await deleteQuote(activeQuote.id);
            onRefresh();
          } catch (err) {
            const msg =
              err instanceof ApiError
                ? err.message
                : "Impossible de supprimer le devis";
            Alert.alert("Erreur", msg);
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  /* ── View document ── */
  const handleViewDocument = async (quote: Quote) => {
    if (!quote.documentPath) return;
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = await getDocumentDownloadUrl(quote.id);
      const destFile = new File(
        Paths.cache,
        quote.documentFileName ?? "devis.pdf",
      );
      const task = File.createDownloadTask(url, destFile, { headers });
      const downloaded = await task.downloadAsync();
      if (!downloaded) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Consultation indisponible",
          "Aucune application capable d'ouvrir ce document n'est installée sur cet appareil.",
        );
        return;
      }

      await Sharing.shareAsync(downloaded.uri, {
        mimeType: quote.documentMimeType ?? undefined,
        dialogTitle: quote.documentFileName ?? `Devis v${quote.version}`,
        UTI: quote.documentMimeType?.includes("pdf")
          ? "com.adobe.pdf"
          : undefined,
      });
    } catch (err) {
      logger.error(
        "QuoteView",
        "Échec ouverture document",
        err instanceof Error ? `${err.name}: ${err.message}` : err,
      );
      Alert.alert("Erreur", "Impossible d'ouvrir le document.");
    }
  };

  /* ── Create form (new version) ── */
  if (showCreateForm) {
    return (
      <View className="gap-three">
        <EmptyQuoteState
          missionId={missionId}
          isArchived={isArchived}
          onQuoteCreated={() => {
            setShowCreateForm(false);
            onRefresh();
          }}
        />
        <QuoteHistory
          quotes={historyQuotes}
          onViewDocument={handleViewDocument}
        />
      </View>
    );
  }

  /* ── Edit form ── */
  if (showEditForm) {
    return (
      <View className="gap-three">
        <EmptyQuoteState
          missionId={missionId}
          isArchived={isArchived}
          onQuoteCreated={() => {
            setShowEditForm(false);
            onRefresh();
          }}
          editingQuote={activeQuote}
          onEditDone={() => setShowEditForm(false)}
        />
        <QuoteHistory
          quotes={historyQuotes}
          onViewDocument={handleViewDocument}
        />
      </View>
    );
  }

  return (
    <View className="gap-three">
      {/* ── Active quote card ── */}
      <ThemedView
        type="backgroundElement"
        className="rounded-three border border-border dark:border-border-dark p-four"
      >
        <View className="flex-row items-center justify-between mb-two">
          <View className="flex-row items-center gap-two">
            <Ionicons name="document-text" color={theme.accent} size={16} />
            <ThemedText type="eyebrow" themeColor="accent">
              Devis actif
            </ThemedText>
          </View>
          <View
            className={`rounded-five px-two py-half ${QUOTE_STATUS_BG[activeQuote.status]}`}
          >
            <ThemedText
              type="eyebrow"
              className={QUOTE_STATUS_FG[activeQuote.status]}
            >
              {QUOTE_STATUS_LABELS[activeQuote.status]}
            </ThemedText>
          </View>
        </View>

        <View className="items-center mb-two">
          <ThemedText
            type="subtitle"
            themeColor="accent"
            className="text-[40px] leading-[44px]"
          >
            {formatAmount(activeQuote.amount, activeQuote.currency)}
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-one"
          >
            Version {activeQuote.version}
          </ThemedText>
        </View>

        {activeQuote.documentFileName && (
          <Pressable
            onPress={() => handleViewDocument(activeQuote)}
            className="flex-row items-center gap-one mt-one justify-center"
          >
            <Ionicons
              name="document-attach"
              color={theme.textSecondary}
              size={14}
            />
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
              className="underline"
            >
              {activeQuote.documentFileName}
            </ThemedText>
            <Ionicons
              name="eye-outline"
              color={theme.textSecondary}
              size={14}
            />
          </Pressable>
        )}

        <View className="items-center mt-two">
          <ThemedText type="small" themeColor="textSecondary">
            Créé le {formatQuoteDateTime(activeQuote.createdAt)}
          </ThemedText>
        </View>

        {isEnvoye && activeQuote.sentAt && (
          <View className="items-center mt-half">
            <ThemedText type="small" themeColor="textSecondary">
              Envoyé le {formatQuoteDateTime(activeQuote.sentAt)}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* ── Actions ── */}
      {!isArchived && (
        <View className="gap-two">
          {isWorking ? (
            <View className="items-center py-two">
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <>
              {isBrouillon && (
                <>
                  {hasDocument && (
                    <PrimaryButton
                      label="Envoyer par email"
                      icon="mail"
                      onPress={handleSendEmail}
                    />
                  )}
                  <PrimaryButton
                    label="Modifier"
                    icon="create-outline"
                    onPress={() => setShowEditForm(true)}
                  />
                  <Pressable
                    onPress={handleDelete}
                    className="items-center py-two"
                  >
                    <ThemedText type="small" themeColor="danger">
                      Supprimer
                    </ThemedText>
                  </Pressable>
                </>
              )}

              {isEnvoye && (
                <>
                  <PrimaryButton label="Accepter" onPress={handleAccept} />
                  <PrimaryButton label="Refuser" onPress={handleRefuse} />
                  <PrimaryButton
                    label="Créer une nouvelle version"
                    onPress={() => setShowCreateForm(true)}
                  />
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* ── History ── */}
      <QuoteHistory
        quotes={historyQuotes}
        onViewDocument={handleViewDocument}
      />
    </View>
  );
}
