import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { FormField, PrimaryButton } from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import { ChipSelect } from "@/components/ui/chip-select";
import {
  MISSION_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
} from "@/constants/mission-labels";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { useTheme } from "@/hooks/use-theme";
import { Mission, MissionStatus, MissionType } from "@/types/mission";

const MISSION_TYPE_OPTIONS = (
  Object.keys(MISSION_TYPE_LABELS) as MissionType[]
).map((value) => ({
  value,
  label: MISSION_TYPE_LABELS[value],
}));

export type MissionFormValues = {
  title: string;
  missionType: MissionType;
  buildingAddress?: string;
  buildingType?: string;
  buildingGpsLat?: number;
  buildingGpsLng?: number;
  legalContext?: string;
  status?: MissionStatus;
};

type MissionFormProps = {
  initialValues?: Partial<Mission>;
  showStatusField?: boolean;
  submitLabel: string;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: MissionFormValues) => void;
};

function getStatusOptions(current: MissionStatus) {
  const next = STATUS_TRANSITIONS[current] ?? [];
  return [current, ...next].map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));
}

export function MissionForm({
  initialValues,
  showStatusField = false,
  submitLabel,
  isSubmitting = false,
  error,
  onSubmit,
}: MissionFormProps) {
  const theme = useTheme();
  const { getCurrentLocation, loading: locationLoading, error: locationError } = useCurrentLocation();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [missionType, setMissionType] = useState<MissionType>(
    initialValues?.missionType ?? "AUTRE",
  );
  const [buildingAddress, setBuildingAddress] = useState(
    initialValues?.buildingAddress ?? "",
  );
  const [buildingType, setBuildingType] = useState(
    initialValues?.buildingType ?? "",
  );
  const [buildingGpsLat, setBuildingGpsLat] = useState(
    initialValues?.buildingGpsLat != null
      ? String(initialValues.buildingGpsLat)
      : "",
  );
  const [buildingGpsLng, setBuildingGpsLng] = useState(
    initialValues?.buildingGpsLng != null
      ? String(initialValues.buildingGpsLng)
      : "",
  );
  const [legalContext, setLegalContext] = useState(
    initialValues?.legalContext ?? undefined,
  );
  const [status, setStatus] = useState<MissionStatus>(
    initialValues?.status ?? "BROUILLON",
  );

  const handleCaptureLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      setBuildingGpsLat(String(coords.latitude));
      setBuildingGpsLng(String(coords.longitude));
    }
  };

  const isValid = title.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const lat = buildingGpsLat.trim()
      ? Number(buildingGpsLat.trim().replace(",", "."))
      : undefined;
    const lng = buildingGpsLng.trim()
      ? Number(buildingGpsLng.trim().replace(",", "."))
      : undefined;

    onSubmit({
      title: title.trim(),
      missionType,
      buildingAddress: buildingAddress.trim() || undefined,
      buildingType: buildingType.trim() || undefined,
      buildingGpsLat: lat !== undefined && !Number.isNaN(lat) ? lat : undefined,
      buildingGpsLng: lng !== undefined && !Number.isNaN(lng) ? lng : undefined,
      legalContext: legalContext?.trim() || undefined,
      ...(showStatusField ? { status } : null),
    });
  };

  return (
    <View className="gap-three">
      <FormField
        label="Titre de la mission"
        icon="document-text"
        placeholder="Ex. Expertise fissures - Villa Andraisoro"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
      />

      <View className="gap-one">
        <ThemedText type="eyebrow" themeColor="accent">
          Type de mission
        </ThemedText>
        <ChipSelect
          options={MISSION_TYPE_OPTIONS}
          value={missionType}
          onChange={setMissionType}
        />
      </View>

      <FormField
        label="Adresse du bâtiment"
        icon="location"
        placeholder="Lot II M 12, Antananarivo"
        value={buildingAddress}
        onChangeText={setBuildingAddress}
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
        <ThemedText type="eyebrow" themeColor="accent">
          Position GPS (optionnel)
        </ThemedText>
        <Pressable
          onPress={handleCaptureLocation}
          disabled={locationLoading}
          className="flex-row items-center justify-center gap-two rounded-three border border-border dark:border-border-dark py-two px-three"
          style={({ pressed }) => ({ opacity: pressed && !locationLoading ? 0.7 : 1 })}
        >
          {locationLoading ? (
            <Ionicons name="hourglass" color={theme.accent} size={16} />
          ) : (
            <Ionicons name="locate" color={theme.accent} size={16} />
          )}
          <ThemedText type="default" themeColor="accent">
            {locationLoading
              ? "Recherche de la position..."
              : buildingGpsLat && buildingGpsLng
                ? "Ma position actuelle"
                : "Capturer ma position GPS"
            }
          </ThemedText>
        </Pressable>
        {locationError && (
          <ThemedText type="small" themeColor="textSecondary" className="text-center">
            {locationError}
          </ThemedText>
        )}
        {buildingGpsLat && buildingGpsLng && (
          <ThemedText type="small" themeColor="textSecondary" className="text-center">
            {buildingGpsLat}, {buildingGpsLng}
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textSecondary" className="text-center">
          Optionnel — vous pouvez saisir manuellement ou laisser vide
        </ThemedText>
      </View>

      <FormField
        label="Contexte juridique"
        icon="document-lock-outline"
        placeholder="Mission ordonnée par le tribunal de commerce"
        value={legalContext}
        onChangeText={setLegalContext}
        autoCapitalize="sentences"
        multiline
        numberOfLines={3}
      />

      {showStatusField && (
        <View className="gap-one">
          <ThemedText type="eyebrow" themeColor="accent">
            Statut
          </ThemedText>
          <ChipSelect
            options={getStatusOptions(initialValues?.status ?? "BROUILLON")}
            value={status}
            onChange={setStatus}
          />
        </View>
      )}

      {error && (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      )}

      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!isValid}
        loading={isSubmitting}
      />
    </View>
  );
}
