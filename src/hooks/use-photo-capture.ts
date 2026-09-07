import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

import { logger } from "@/utils/logger";

/**
 * Redimensionne et compresse la photo capturée pour rester sous la limite
 * backend (10 Mo max) et accélérer l'upload : max 1600px de large,
 * JPEG qualité 0.7.
 */
async function compressCapture(uri: string): Promise<string> {
  try {
    const context = ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    const result = await context;
    return result.uri;
  } catch (err) {
    // Si la compression échoue, on tente quand même l'upload de l'original :
    // mieux vaut une erreur backend claire (fichier trop lourd) que de perdre
    // la photo.
    logger.warn(
      "Photos",
      "Compression de la photo échouée, envoi de l'original",
      err instanceof Error ? err.message : err,
    );
    return uri;
  }
}

async function ensureCameraPermission(): Promise<boolean> {
  const { granted, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (granted) return true;

  Alert.alert(
    "Caméra indisponible",
    canAskAgain
      ? "L'autorisation d'utiliser la caméra est nécessaire pour photographier les constats."
      : "L'accès à la caméra a été refusé. Activez-le dans les réglages de l'appareil pour photographier les constats.",
    canAskAgain
      ? [{ text: "OK", style: "cancel" }]
      : [
          { text: "Annuler", style: "cancel" },
          { text: "Ouvrir les réglages", onPress: () => Linking.openSettings() },
        ],
  );
  return false;
}

type UsePhotoCaptureResult = {
  /** Lance la caméra, compresse la capture et renvoie l'URI locale prête à l'upload. */
  capture: () => Promise<string | null>;
  isCapturing: boolean;
};

/**
 * Capture photo réutilisable (MissionDetailScreen, ZoneDetailScreen, puis
 * ObservationDetailScreen plus tard). N'upload rien : renvoie l'URI locale
 * compressée — l'appelant gère l'upload et le cas d'échec.
 */
export function usePhotoCapture(): UsePhotoCaptureResult {
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<string | null> => {
    if (!(await ensureCameraPermission())) return null;

    setIsCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.length) return null;

      const asset = result.assets[0];
      const compressedUri = await compressCapture(asset.uri);
      logger.info("Photos", "Photo capturée", { uri: compressedUri });
      return compressedUri;
    } catch (err) {
      logger.error(
        "Photos",
        "Échec de la capture photo",
        err instanceof Error ? err.message : err,
      );
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir la caméra. Réessaie dans un instant.",
      );
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return { capture, isCapturing };
}

export const isNativePlatform = Platform.OS !== "web";
