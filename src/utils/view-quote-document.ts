import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

import { getDocumentDownloadUrl } from "@/services/quote-services";
import { getToken } from "@/storage/token-storage";
import type { Quote } from "@/types/quote";
import { logger } from "@/utils/logger";

export async function viewQuoteDocument(quote: Quote): Promise<void> {
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
}
