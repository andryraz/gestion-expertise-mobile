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
  const [status, setStatus] = useState<MissionStatus>(
    initialValues?.status ?? "BROUILLON",
  );

  const isValid = title.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      title: title.trim(),
      missionType,
      buildingAddress: buildingAddress.trim() || undefined,
      buildingType: buildingType.trim() || undefined,
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
