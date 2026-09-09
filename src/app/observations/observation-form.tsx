import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DisorderTypeSelect } from "@/components/observations/disorder-type-select";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ChipSelect } from "@/components/ui/chip-select";
import { PrimaryButton } from "@/components/ui/primary-button";
import { OBSERVATION_SEVERITY_LABELS } from "@/constants/observation-labels";
import { useTheme } from "@/hooks/use-theme";
import { useDisorderTypes } from "@/queries/disorder-types";
import {
  useCreateObservation,
  useObservation,
  useUpdateObservation,
} from "@/queries/observations";
import { ApiError } from "@/services/api-client";
import type { DisorderType } from "@/types/disorder-type";
import type { ObservationSeverity } from "@/types/observation";
import { logger } from "@/utils/logger";

type FormParams = {
  zoneId?: string;
  zoneName?: string;
  /** En mode édition, on charge l'observation par son id. */
  mode?: "create" | "edit";
  observationId?: string;
};

const SEVERITY_OPTIONS = (
  Object.keys(OBSERVATION_SEVERITY_LABELS) as ObservationSeverity[]
).map((severity) => ({
  value: severity,
  label: OBSERVATION_SEVERITY_LABELS[severity],
}));

type ObservationFormFieldsProps = {
  isEdit: boolean;
  zoneId?: string;
  observationId?: string;
  zoneName?: string;
  initialDisorderType: DisorderType | null;
  initialDescription: string;
  initialSeverity: ObservationSeverity;
  initialProbableCause: string;
};

function ObservationFormFields({
  isEdit,
  zoneId,
  observationId,
  zoneName,
  initialDisorderType,
  initialDescription,
  initialSeverity,
  initialProbableCause,
}: ObservationFormFieldsProps) {
  const theme = useTheme();

  const [disorderType, setDisorderType] = useState<DisorderType | null>(
    initialDisorderType,
  );
  const [description, setDescription] = useState(initialDescription);
  const [severity, setSeverity] = useState<ObservationSeverity>(
    initialSeverity,
  );
  const [probableCause, setProbableCause] = useState(initialProbableCause);

  const createObservationMutation = useCreateObservation(zoneId ?? "");
  const updateObservationMutation = useUpdateObservation();
  const isSaving =
    createObservationMutation.isPending || updateObservationMutation.isPending;

  const handleSubmit = async () => {
    if (!disorderType) {
      Alert.alert("Erreur", "Le type de désordre est obligatoire");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Erreur", "La description est obligatoire");
      return;
    }

    try {
      if (isEdit && observationId) {
        const updated = await updateObservationMutation.mutateAsync({
          observationId,
          payload: {
            disorderTypeId: disorderType.id,
            description: description.trim(),
            severity,
            // null efface la cause actuelle côté backend (spec PATCH).
            probableCause: probableCause.trim() ? probableCause.trim() : null,
          },
        });
        logger.info("Observations", "Observation modifiée", {
          id: updated.id,
        });
      } else {
        if (!zoneId) {
          Alert.alert("Erreur", "La zone de l'observation est manquante");
          return;
        }
        const created = await createObservationMutation.mutateAsync({
          disorderTypeId: disorderType.id,
          description: description.trim(),
          severity,
          probableCause: probableCause.trim() || undefined,
        });
        logger.info("Observations", "Observation créée", {
          id: created.id,
          zoneId: created.zoneId,
        });
      }
      router.back();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : isEdit
            ? "Impossible de modifier l'observation"
            : "Impossible de créer l'observation";
      Alert.alert("Erreur", message);
      logger.error(
        "Observations",
        `Échec de ${isEdit ? "modification" : "création"} d'observation`,
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
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                disabled={isSaving}
              >
                <Ionicons name="chevron-back" color={theme.text} size={24} />
              </Pressable>
              <View className="flex-1">
                <ThemedText
                  type="smallBold"
                  className="text-xl"
                  themeColor="accent"
                >
                  {isEdit ? "Modifier l'observation" : "Nouvelle observation"}
                </ThemedText>
                {zoneName && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Zone : {zoneName}
                  </ThemedText>
                )}
              </View>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-four pb-20"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Type de désordre *
                </ThemedText>
                <DisorderTypeSelect
                  value={disorderType}
                  onChange={setDisorderType}
                />
              </View>

              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Description *
                </ThemedText>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Décrivez le désordre constaté..."
                  placeholderTextColor={theme.textSecondary}
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium min-h-[100px]"
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                />
              </View>

              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-two"
                >
                  Sévérité *
                </ThemedText>
                <ChipSelect
                  options={SEVERITY_OPTIONS}
                  value={severity}
                  onChange={setSeverity}
                />
              </View>

              <View className="mb-four">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Cause probable (optionnel)
                </ThemedText>
                <TextInput
                  value={probableCause}
                  onChangeText={setProbableCause}
                  placeholder="Ex : retrait du béton après séchage..."
                  placeholderTextColor={theme.textSecondary}
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium min-h-[80px]"
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                />
              </View>

              <PrimaryButton
                label={
                  isEdit
                    ? "Enregistrer les modifications"
                    : "Créer l'observation"
                }
                onPress={handleSubmit}
                disabled={isSaving}
                loading={isSaving}
                loadingLabel={isEdit ? "Enregistrement..." : "Création..."}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}

/**
 * Écran de création ET de modification d'une observation. En création,
 * une observation appartient toujours à une zone : le zoneId est hérité
 * des paramètres de navigation et n'est jamais demandé à l'utilisateur.
 * En édition (mode="edit"), on charge l'observation existante par son id
 * puis on monte le formulaire pré-rempli (les champs sont initialisés une
 * seule fois, à partir des valeurs chargées) avant de soumettre un PATCH
 * partiel conforme à la spec /observations/{id}.
 */
export default function ObservationFormScreen() {
  const params = useLocalSearchParams<FormParams>();
  const isEdit = params.mode === "edit";

  const {
    data: observation,
    isLoading: isLoadingObservation,
    error: observationError,
  } = useObservation(isEdit ? (params.observationId ?? "") : "");

  // Le backend peut ne pas inclure le type de désordre imbriqué dans le
  // détail : on retombe sur la liste complète (mise en cache partagée
  // avec DisorderTypeSelect) pour retrouver le type actuel.
  const { data: allDisorderTypes = [], isLoading: isLoadingDisorderTypes } =
    useDisorderTypes();

  const nestedDisorderType = observation?.disorderType ?? null;
  const listDisorderType =
    allDisorderTypes.find((t) => t.id === observation?.disorderTypeId) ?? null;

  const initialDisorderType: DisorderType | null = useMemo(
    () =>
      listDisorderType ??
      (nestedDisorderType
        ? { ...nestedDisorderType, createdAt: "" }
        : null),
    [listDisorderType, nestedDisorderType],
  );

  const waitingForDisorderType =
    isEdit &&
    !!observation &&
    !nestedDisorderType &&
    !listDisorderType &&
    allDisorderTypes.length === 0 &&
    isLoadingDisorderTypes;

  useEffect(() => {
    if (isEdit && params.observationId && observationError) {
      Alert.alert(
        "Erreur",
        observationError instanceof ApiError
          ? observationError.message
          : "Impossible de charger l'observation",
      );
      router.back();
    }
  }, [isEdit, params.observationId, observationError]);

  if (
    isEdit &&
    (isLoadingObservation || (!observation && observationError))
  ) {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <ThemedText themeColor="textSecondary" className="text-center py-four">
            Chargement...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (waitingForDisorderType) {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <ThemedText themeColor="textSecondary" className="text-center py-four">
            Chargement...
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ObservationFormFields
      isEdit={isEdit}
      zoneId={params.zoneId}
      observationId={params.observationId}
      zoneName={observation?.zone?.name ?? params.zoneName}
      initialDisorderType={initialDisorderType}
      initialDescription={observation?.description ?? ""}
      initialSeverity={observation?.severity ?? "MINEUR"}
      initialProbableCause={observation?.probableCause ?? ""}
    />
  );
}
