import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryAccordion } from "@/components/buildings/technical-sheet/category-accordion";
import { ScreenFade } from "@/components/screen-fade";
import { SegmentedControl } from "@/components/missions/segmented-control";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import {
  findSelectionByMaterialOptionId,
  technicalSheetKeys,
  useOuvrageCatalog,
  useTechnicalSelections,
  useToggleTechnicalSelection,
  useUpdateTechnicalSelection,
} from "@/queries/technical-sheets";
import { ApiError } from "@/services/api-client";
import { getBuilding } from "@/services/building-services";
import type { Building } from "@/types/building";
import type {
  FicheType,
  TechnicalSelection,
} from "@/types/technical-sheet";
import { logger } from "@/utils/logger";
import { queryClient } from "@/lib/query-client";

type TechnicalSheetParams = {
  buildingId: string;
  isArchived?: string;
  missionStatus?: string;
};

const FICHE_TABS = [
  { key: "GROS_OEUVRE", label: "Gros-Œuvre" },
  { key: "SECOND_OEUVRE", label: "Second-Œuvre" },
];

const NOTE_LABELS: Record<FicheType, string> = {
  GROS_OEUVRE: "Observation",
  SECOND_OEUVRE: "Localisation",
};

const NOTE_PLACEHOLDERS: Record<FicheType, string> = {
  GROS_OEUVRE: "Ex : semelle fissurée côté est...",
  SECOND_OEUVRE: "Ex : RDC, mur porteur nord...",
};

export default function TechnicalSheetScreen() {
  const { buildingId, isArchived, missionStatus } =
    useLocalSearchParams<TechnicalSheetParams>();
  const archived = isArchived === "true";
  // Backends récents exigent une mission EN_COURS pour cocher/décocher.
  const missionAllowsEdit =
    !missionStatus || missionStatus === "EN_COURS";
  const canEdit = !archived && missionAllowsEdit;
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<FicheType>("GROS_OEUVRE");
  const [building, setBuilding] = useState<Building | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const {
    data: catalog = [],
    isLoading: isLoadingCatalog,
    error: catalogError,
  } = useOuvrageCatalog(activeTab);

  const {
    data: selections,
    isLoading: isLoadingSelections,
    error: selectionsError,
    refetch: refetchSelections,
  } = useTechnicalSelections(buildingId);

  const toggleMutation = useToggleTechnicalSelection(buildingId);
  const updateNoteMutation = useUpdateTechnicalSelection(buildingId);

  // Une seule mutation en vol à la fois : la case est verrouillée
  // pendant le POST/DELETE pour éviter les doubles-taps rapides.
  const pendingToggleRef = useRef(false);

  const error = catalogError
    ? catalogError instanceof ApiError
      ? catalogError.message
      : "Impossible de charger le catalogue"
    : selectionsError
      ? selectionsError instanceof ApiError
        ? selectionsError.message
        : "Impossible de charger les sélections"
      : null;

  const loadBuilding = useCallback(async () => {
    if (!buildingId) return;
    try {
      const result = await getBuilding(buildingId);
      setBuilding(result);
    } catch (err) {
      logger.error("TechnicalSheet", "Impossible de charger le bâtiment", {
        buildingId,
        message: err instanceof Error ? err.message : err,
      });
    }
  }, [buildingId]);

  useFocusEffect(
    useCallback(() => {
      loadBuilding();
      refetchSelections();
    }, [loadBuilding, refetchSelections]),
  );

  const handleToggle = useCallback(
    async (materialOptionId: string, checked: boolean) => {
      if (!canEdit || pendingToggleRef.current) return;

      // Recroisement côté client : on cherche la sélection existante
      // pour décider de l'action (POST vs DELETE).
      const selection = findSelectionByMaterialOptionId(
        queryClient.getQueryData<TechnicalSelection[]>(
          technicalSheetKeys.selections(buildingId),
        ),
        materialOptionId,
      );

      // Garde-fou : l'état de la case peut avoir changé entre le rendu
      // et le tap (double-tap rapide).
      if (checked !== !!selection) {
        logger.warn(
          "TechnicalSheet",
          "État de la case incohérent avec le cache, action ignorée",
          { materialOptionId, checked },
        );
        return;
      }

      pendingToggleRef.current = true;
      try {
        await toggleMutation.mutateAsync({ materialOptionId, selection });
        logger.info(
          "TechnicalSheet",
          selection ? "Matériau décoché" : "Matériau coché",
          { buildingId, materialOptionId },
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Double-tap rapide : la sélection existe déjà côté backend.
          // Pas d'erreur alarmante, on resynchronise silencieusement.
          logger.warn(
            "TechnicalSheet",
            "409 : option déjà cochée pour ce bâtiment, resynchronisation",
            { buildingId, materialOptionId },
          );
          queryClient.invalidateQueries({
            queryKey: technicalSheetKeys.selections(buildingId),
          });
        } else {
          const message =
            err instanceof ApiError
              ? err.message
              : "Impossible d'enregistrer la sélection";
          logger.error("TechnicalSheet", "Échec du toggle", {
            buildingId,
            materialOptionId,
            message,
          });
          // Le message reste discret (bandeau en haut de l'écran) car
          // l'état des cases est de toute façon resynchronisé.
          setToggleError(message);
        }
      } finally {
        pendingToggleRef.current = false;
      }
    },
    [buildingId, canEdit, toggleMutation],
  );

  const handleSaveNote = useCallback(
    (selectionId: string, note: string | null) => {
      updateNoteMutation.mutate(
        { selectionId, payload: { note } },
        {
          onSuccess: () =>
            logger.info("TechnicalSheet", "Note enregistrée", {
              buildingId,
              selectionId,
            }),
          onError: (err) =>
            logger.error("TechnicalSheet", "Échec de l'enregistrement de la note", {
              buildingId,
              selectionId,
              message: err instanceof Error ? err.message : err,
            }),
        },
      );
    },
    [buildingId, updateNoteMutation],
  );

  const dismissToggleError = () => setToggleError(null);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <View className="flex-row items-center gap-two px-four pt-three pb-four">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <View className="flex-1">
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                className="text-base"
              >
                Fiche technique
              </ThemedText>
              <ThemedText
                type="smallBold"
                numberOfLines={1}
                className="text-xl leading-7"
              >
                {building?.name ?? "Bâtiment"}
              </ThemedText>
            </View>
          </View>

          <View className="px-four pb-three">
            <SegmentedControl
              options={FICHE_TABS}
              value={activeTab}
              onChange={(key) => setActiveTab(key as FicheType)}
            />
          </View>

          {(isLoadingCatalog || isLoadingSelections) && (
            <View className="items-center py-six">
              <ActivityIndicator color={theme.accent} />
            </View>
          )}

          {toggleError && !isLoadingCatalog && !isLoadingSelections && (
            <View className="mx-four mb-two flex-row items-center gap-two rounded-two border border-danger/40 bg-danger/10 px-three py-two">
              <Ionicons
                name="cloud-offline-outline"
                color={theme.danger}
                size={16}
              />
              <ThemedText type="small" themeColor="danger" className="flex-1">
                {toggleError}
              </ThemedText>
              <Pressable onPress={dismissToggleError} hitSlop={8}>
                <Ionicons name="close" color={theme.danger} size={16} />
              </Pressable>
            </View>
          )}

          {error && !isLoadingCatalog && !isLoadingSelections && (
            <View className="px-four py-three">
              <ThemedText themeColor="danger">{error}</ThemedText>
            </View>
          )}

          {!isLoadingCatalog && !isLoadingSelections && !error && (
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-four pb-20"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {catalog.length === 0 ? (
                <View className="items-center py-six">
                  <Ionicons
                    name="construct-outline"
                    color={theme.textSecondary}
                    size={32}
                  />
                  <ThemedText
                    themeColor="textSecondary"
                    className="mt-two text-center"
                  >
                    Catalogue indisponible pour cette fiche
                  </ThemedText>
                </View>
              ) : (
                catalog.map((rootCategory) => (
                  <CategoryAccordion
                    key={rootCategory.id}
                    category={rootCategory}
                    depth={0}
                    selections={selections ?? []}
                    isToggling={!canEdit || toggleMutation.isPending}
                    noteLabel={NOTE_LABELS[activeTab]}
                    notePlaceholder={NOTE_PLACEHOLDERS[activeTab]}
                    onToggle={handleToggle}
                    onSaveNote={handleSaveNote}
                  />
                ))
              )}
            </ScrollView>
          )}
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
