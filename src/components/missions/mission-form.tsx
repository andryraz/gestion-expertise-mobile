import { useState } from "react";
import { View } from "react-native";

import { FormField, PrimaryButton } from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import { ChipSelect } from "@/components/ui/chip-select";
import {
  MISSION_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
} from "@/constants/mission-labels";
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
      <View className="flex-row gap-two">
        <View className="flex-1">
          <FormField
            label="Latitude GPS"
            icon="navigate-outline"
            placeholder="-18.8792"
            value={buildingGpsLat}
            onChangeText={setBuildingGpsLat}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Longitude GPS"
            icon="navigate-outline"
            placeholder="47.5079"
            value={buildingGpsLng}
            onChangeText={setBuildingGpsLng}
            keyboardType="numeric"
          />
        </View>
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
