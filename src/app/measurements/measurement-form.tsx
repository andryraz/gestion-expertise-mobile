import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ChipSelect } from "@/components/ui/chip-select";
import { FormField } from "@/components/ui/form-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
    MEASUREMENT_UNITS,
    MEASUREMENT_UNIT_LABELS,
} from "@/constants/measurement-labels";
import { useTheme } from "@/hooks/use-theme";
import {
    useCreateMeasurement,
    useMeasurementTypes,
    useUpdateMeasurement,
} from "@/queries/measurements";
import { ApiError } from "@/services/api-client";
import type { MeasurementUnit } from "@/types/measurement";
import { logger } from "@/utils/logger";

type FormParams = {
  missionId: string;
  mode: "create" | "edit";
  buildingId?: string;
  zoneId?: string;
  contextLabel?: string;
  measurementId?: string;
  measureType?: string;
  value?: string;
  unit?: string;
  label?: string;
};

const UNIT_OPTIONS = MEASUREMENT_UNITS.map((unit) => ({
  value: unit,
  label: MEASUREMENT_UNIT_LABELS[unit],
}));

export default function MeasurementFormScreen() {
  const params = useLocalSearchParams<FormParams>();
  const theme = useTheme();
  const isEdit = params.mode === "edit";

  const [measureType, setMeasureType] = useState(params.measureType ?? "");
  const [value, setValue] = useState(params.value ?? "");
  const [unit, setUnit] = useState<MeasurementUnit>(
    (params.unit as MeasurementUnit) ?? "M",
  );
  const [label, setLabel] = useState(params.label ?? "");

  const { data: knownTypes = [] } = useMeasurementTypes(params.missionId);
  const suggestions = useMemo(() => {
    const query = measureType.trim().toLowerCase();
    return knownTypes
      .filter((t) => t.toLowerCase() !== query)
      .filter((t) => !query || t.toLowerCase().includes(query))
      .slice(0, 6);
  }, [knownTypes, measureType]);

  const createMutation = useCreateMeasurement(params.missionId);
  const updateMutation = useUpdateMeasurement(params.missionId);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    const trimmedType = measureType.trim();
    const numericValue = Number(value.replace(",", "."));

    if (!trimmedType) {
      Alert.alert("Erreur", "Le type de mesure est obligatoire");
      return;
    }
    if (!value.trim() || Number.isNaN(numericValue)) {
      Alert.alert("Erreur", "La valeur doit être un nombre valide");
      return;
    }

    try {
      if (isEdit && params.measurementId) {
        await updateMutation.mutateAsync({
          measurementId: params.measurementId,
          payload: {
            measureType: trimmedType,
            value: numericValue,
            unit,
            label: label.trim() || undefined,
          },
        });
        logger.info("Mesures", "Mesure modifiée", {
          id: params.measurementId,
        });
      } else {
        await createMutation.mutateAsync({
          measureType: trimmedType,
          value: numericValue,
          unit,
          label: label.trim() || undefined,
          // Jamais demandé à l'expert : l'instant de saisie fait foi,
          // même principe que takenAt pour les photos.
          measuredAt: new Date().toISOString(),
          buildingId: params.buildingId || undefined,
          zoneId: params.zoneId || undefined,
        });
        logger.info("Mesures", "Mesure créée", {
          missionId: params.missionId,
          buildingId: params.buildingId ?? null,
          zoneId: params.zoneId ?? null,
        });
      }
      router.back();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'enregistrer la mesure";
      Alert.alert("Erreur", message);
      logger.error(
        "Mesures",
        `Échec de ${isEdit ? "modification" : "création"}`,
        { message },
      );
    }
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-row items-center gap-two px-four pt-three pb-four">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" color={theme.text} size={24} />
              </Pressable>
              <ThemedText
                type="smallBold"
                className="text-xl flex-1"
                themeColor="accent"
              >
                {isEdit ? "Modifier la mesure" : "Nouvelle mesure"}
              </ThemedText>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-four pb-20"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {!!params.contextLabel && (
                <View className="mb-three">
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    className="mb-one"
                  >
                    {params.buildingId ? "Bâtiment" : "Zone"}
                  </ThemedText>
                  <ThemedView
                    type="backgroundElement"
                    className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark px-three py-three"
                  >
                    <Ionicons
                      name={
                        params.buildingId
                          ? "business-outline"
                          : "location-outline"
                      }
                      color={theme.textSecondary}
                      size={16}
                    />
                    <ThemedText type="default" className="flex-1">
                      {params.contextLabel}
                    </ThemedText>
                    <Ionicons
                      name="lock-closed-outline"
                      color={theme.textSecondary}
                      size={14}
                    />
                  </ThemedView>
                </View>
              )}

              <View className="mb-three">
                <FormField
                  label="Type de mesure *"
                  icon="pricetag-outline"
                  placeholder="Surface façade, Hauteur sous plafond..."
                  value={measureType}
                  onChangeText={setMeasureType}
                  autoCapitalize="sentences"
                />
                {suggestions.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex-row gap-two mt-two"
                  >
                    {suggestions.map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setMeasureType(t)}
                        className="rounded-five border border-border bg-background-element px-three py-one dark:border-border-dark dark:bg-background-element-dark"
                      >
                        <ThemedText type="small" themeColor="textSecondary">
                          {t}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View className="mb-four flex-row gap-two">
                <View className="flex-[1.1]">
                  <FormField
                    label="Valeur *"
                    icon="calculator-outline"
                    placeholder="12,5"
                    value={value}
                    onChangeText={setValue}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    className="mb-one"
                  >
                    Unité *
                  </ThemedText>
                  <ChipSelect
                    options={UNIT_OPTIONS}
                    value={unit}
                    onChange={setUnit}
                  />
                </View>
              </View>

              <View className="mb-four">
                <FormField
                  label="Note (optionnel)"
                  icon="document-text-outline"
                  placeholder="Façade nord, niveau RDC..."
                  value={label}
                  onChangeText={setLabel}
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ minHeight: 80 }}
                />
              </View>

              <PrimaryButton
                label={
                  isEdit ? "Enregistrer les modifications" : "Ajouter la mesure"
                }
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
                loadingLabel="Enregistrement..."
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
