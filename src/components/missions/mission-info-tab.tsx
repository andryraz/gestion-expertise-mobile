import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { FormField } from "@/components/auth/form-field";
import { PrimaryButton } from "@/components/auth/primary-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { useTheme } from "@/hooks/use-theme";
import type { Mission, UpdateMissionPayload } from "@/types/mission";

type MissionInfoTabProps = {
  mission: Mission;
  isArchived: boolean;
  onUpdate?: (payload: UpdateMissionPayload) => Promise<void>;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  const theme = useTheme();
  return (
    <View className="flex-row items-start gap-two py-two">
      <Ionicons
        name={icon}
        color={theme.textSecondary}
        size={16}
        style={{ marginTop: 2 }}
      />
      <View className="flex-1">
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="default" className="mt-half">
          {value || "—"}
        </ThemedText>
      </View>
    </View>
  );
}

export function MissionInfoTab({
  mission,
  isArchived,
  onUpdate,
}: MissionInfoTabProps) {
  const theme = useTheme();
  const {
    getCurrentLocation,
    loading: locationLoading,
    error: locationError,
  } = useCurrentLocation();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [address, setAddress] = useState(mission.buildingAddress ?? "");
  const [buildingType, setBuildingType] = useState(mission.buildingType ?? "");
  const [lat, setLat] = useState(
    mission.buildingGpsLat != null ? String(mission.buildingGpsLat) : "",
  );
  const [lng, setLng] = useState(
    mission.buildingGpsLng != null ? String(mission.buildingGpsLng) : "",
  );
  const [legalContext, setLegalContext] = useState(mission.legalContext ?? "");

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const latNum = lat.trim()
        ? Number(lat.trim().replace(",", "."))
        : undefined;
      const lngNum = lng.trim()
        ? Number(lng.trim().replace(",", "."))
        : undefined;
      await onUpdate({
        buildingAddress: address.trim() || undefined,
        buildingType: buildingType.trim() || undefined,
        buildingGpsLat:
          latNum !== undefined && !Number.isNaN(latNum) ? latNum : undefined,
        buildingGpsLng:
          lngNum !== undefined && !Number.isNaN(lngNum) ? lngNum : undefined,
        legalContext: legalContext.trim() || undefined,
      });
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAddress(mission.buildingAddress ?? "");
    setBuildingType(mission.buildingType ?? "");
    setLat(
      mission.buildingGpsLat != null ? String(mission.buildingGpsLat) : "",
    );
    setLng(
      mission.buildingGpsLng != null ? String(mission.buildingGpsLng) : "",
    );
    setLegalContext(mission.legalContext ?? "");
    setEditing(false);
  };

  const handleCaptureLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      setLat(String(coords.latitude));
      setLng(String(coords.longitude));
    }
  };

  if (editing) {
    return (
      <View className="gap-three">
        <FormField
          label="Adresse du bâtiment"
          icon="location"
          placeholder="Lot II M 12, Antananarivo"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="sentences"
        />
        <FormField
          label="Type de bâtiment"
          icon="business"
          placeholder="Villa, immeuble, entrepôt..."
          value={buildingType}
          onChangeText={setBuildingType}
          autoCapitalize="sentences"
        />
        <View className="gap-one">
          <ThemedText type="eyebrow" themeColor="textSecondary">
            Position GPS (optionnel)
          </ThemedText>
          <Pressable
            onPress={handleCaptureLocation}
            disabled={locationLoading}
            className="flex-row items-center justify-center gap-two rounded-three border border-border dark:border-border-dark py-two px-three"
            style={({ pressed }) => ({
              opacity: pressed && !locationLoading ? 0.7 : 1,
            })}
          >
            {locationLoading ? (
              <Ionicons
                name="hourglass"
                color={theme.textSecondary}
                size={16}
              />
            ) : (
              <Ionicons name="locate" color={theme.textSecondary} size={16} />
            )}
            <ThemedText type="default" themeColor="textSecondary">
              {locationLoading
                ? "Recherche de la position..."
                : lat && lng
                  ? "Ma position actuelle"
                  : "Capturer ma position GPS"}
            </ThemedText>
          </Pressable>
          {locationError && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              className="text-center"
            >
              {locationError}
            </ThemedText>
          )}
          {lat && lng && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              className="text-center"
            >
              {lat}, {lng}
            </ThemedText>
          )}
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="text-center"
          >
            Optionnel — vous pouvez laisser vide
          </ThemedText>
        </View>
        <FormField
          label="Contexte juridique"
          icon="document-lock-outline"
          placeholder="Mission ordonnée par le tribunal..."
          value={legalContext}
          onChangeText={setLegalContext}
          autoCapitalize="sentences"
          multiline
          numberOfLines={3}
        />
        <View className="flex-row gap-two">
          <View className="flex-1">
            <PrimaryButton label="Annuler" onPress={handleCancel} />
          </View>
          <View className="flex-1">
            <PrimaryButton
              label="Enregistrer"
              onPress={handleSave}
              loading={isSaving}
              loadingLabel="Enregistrement..."
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-two">
        <ThemedText type="eyebrow" themeColor="accent">
          Informations du bâtiment
        </ThemedText>
        {!isArchived && onUpdate && (
          <Pressable
            onPress={() => setEditing(true)}
            hitSlop={8}
            className="flex-row items-center gap-one"
          >
            <Ionicons name="pencil" color={theme.accent} size={14} />
            <ThemedText type="small" themeColor="accent">
              Modifier
            </ThemedText>
          </Pressable>
        )}
      </View>

      <ThemedView
        type="backgroundElement"
        className="rounded-three border border-border dark:border-border-dark px-three"
      >
        <InfoRow
          icon="location"
          label="Adresse"
          value={mission.buildingAddress}
        />
        <View className="border-t border-border dark:border-border-dark" />
        <InfoRow
          icon="business"
          label="Type de bâtiment"
          value={mission.buildingType}
        />
        <View className="border-t border-border dark:border-border-dark" />
        <InfoRow
          icon="navigate-outline"
          label="Coordonnées GPS"
          value={
            mission.buildingGpsLat != null && mission.buildingGpsLng != null
              ? `${mission.buildingGpsLat}, ${mission.buildingGpsLng}`
              : null
          }
        />
        {mission.legalContext && (
          <>
            <View className="border-t border-border dark:border-border-dark" />
            <InfoRow
              icon="document-lock-outline"
              label="Contexte juridique"
              value={mission.legalContext}
            />
          </>
        )}
      </ThemedView>
    </View>
  );
}
