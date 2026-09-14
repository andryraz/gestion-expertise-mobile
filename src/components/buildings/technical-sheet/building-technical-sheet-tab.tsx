import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { CategoryAccordion } from "@/components/buildings/technical-sheet/category-accordion";
import { SegmentedControl } from "@/components/missions/segmented-control";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { queryClient } from "@/lib/query-client";
import {
    findSelectionByMaterialOptionId,
    technicalSheetKeys,
    useBuildingTechnicalSelections,
    useOuvrageCatalog,
    useToggleTechnicalSelection,
    useUpdateTechnicalSelection,
} from "@/queries/technical-sheets";
import { ApiError } from "@/services/api-client";
import type { FicheType, TechnicalSelection } from "@/types/technical-sheet";
import { logger } from "@/utils/logger";

type BuildingTechnicalSheetTabProps = {
  buildingId: string;
  isArchived: boolean;
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

/**
 * Fiche technique du bâtiment (racine de la hiérarchie : contrairement
 * aux zones, il n'y a pas de niveau parent dont copier les sélections).
 * Onglet de l'écran Bâtiment (option A) : monté uniquement quand
 * l'onglet « Fiche technique » est actif, comme les onglets de
 * MissionDetailScreen.
 */
export function BuildingTechnicalSheetTab({
  buildingId,
  isArchived,
  missionStatus,
}: BuildingTechnicalSheetTabProps) {
  // Backends récents exigent une mission EN_COURS pour cocher/décocher.
  const missionAllowsEdit = !missionStatus || missionStatus === "EN_COURS";
  const canEdit = !isArchived && missionAllowsEdit;
  const theme = useTheme();

  const [activeFicheTab, setActiveFicheTab] =
    useState<FicheType>("GROS_OEUVRE");
  const [toggleError, setToggleError] = useState<string | null>(null);

  const {
    data: catalog = [],
    isLoading: isLoadingCatalog,
    error: catalogError,
  } = useOuvrageCatalog(activeFicheTab);

  const {
    data: selections,
    isLoading: isLoadingSelections,
    error: selectionsError,
    refetch: refetchSelections,
  } = useBuildingTechnicalSelections(buildingId);

  const buildingTarget = { kind: "building", buildingId } as const;
  const toggleMutation = useToggleTechnicalSelection(buildingTarget);
  const updateNoteMutation = useUpdateTechnicalSelection(buildingTarget);

  // Toggles en vol, par option : grâce à la mise à jour optimiste, SEULE
  // la ligne concernée est verrouillée (anti double-tap) ; toutes les
  // autres cases restent cliquables instantanément.
  const pendingToggleIdsRef = useRef<Set<string>>(new Set<string>());
  const [pendingToggleIds, setPendingToggleIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const setTogglePending = useCallback((optionId: string, pending: boolean) => {
    const next = new Set(pendingToggleIdsRef.current);
    if (pending) {
      next.add(optionId);
    } else {
      next.delete(optionId);
    }
    pendingToggleIdsRef.current = next;
    setPendingToggleIds(next);
  }, []);

  const error = catalogError
    ? catalogError instanceof ApiError
      ? catalogError.message
      : "Impossible de charger le catalogue"
    : selectionsError
      ? selectionsError instanceof ApiError
        ? selectionsError.message
        : "Impossible de charger les sélections"
      : null;

  // Resynchronisation à chaque retour sur l'onglet (et à l'ouverture,
  // puisque cet effet se déclenche aussi au montage si l'écran est déjà
  // au premier plan).
  useFocusEffect(
    useCallback(() => {
      refetchSelections();
    }, [refetchSelections]),
  );

  const handleToggle = useCallback(
    async (materialOptionId: string, checked: boolean) => {
      if (!canEdit || pendingToggleIdsRef.current.has(materialOptionId)) return;

      // Recroisement côté client : on cherche la sélection existante
      // pour décider de l'action (POST vs DELETE).
      const selection = findSelectionByMaterialOptionId(
        queryClient.getQueryData<TechnicalSelection[]>(
          technicalSheetKeys.buildingSelections(buildingId),
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

      setTogglePending(materialOptionId, true);
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
          logger.warn(
            "TechnicalSheet",
            "409 : option déjà cochée pour ce bâtiment, resynchronisation",
            { buildingId, materialOptionId },
          );
          queryClient.invalidateQueries({
            queryKey: technicalSheetKeys.buildingSelections(buildingId),
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
          setToggleError(message);
        }
      } finally {
        setTogglePending(materialOptionId, false);
      }
    },
    [buildingId, canEdit, setTogglePending, toggleMutation],
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
            logger.error(
              "TechnicalSheet",
              "Échec de l'enregistrement de la note",
              {
                buildingId,
                selectionId,
                message: err instanceof Error ? err.message : err,
              },
            ),
        },
      );
    },
    [buildingId, updateNoteMutation],
  );

  const dismissToggleError = () => setToggleError(null);

  const isLoadingAnything = isLoadingCatalog || isLoadingSelections;

  return (
    <View className="flex-1">
      <View className="mb-three">
        <SegmentedControl
          options={FICHE_TABS}
          value={activeFicheTab}
          onChange={(key) => setActiveFicheTab(key as FicheType)}
        />
      </View>

      {toggleError && (
        <View className="mb-two flex-row items-center gap-two rounded-two border border-danger/40 bg-danger/10 px-three py-two">
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

      {isLoadingAnything && (
        <View className="items-center py-six">
          <ActivityIndicator color={theme.accent} />
        </View>
      )}

      {!isLoadingAnything && error && (
        <View className="px-two py-three">
          <ThemedText themeColor="danger">{error}</ThemedText>
        </View>
      )}

      {!isLoadingAnything && !error && (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-two"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
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
                canEdit={canEdit}
                pendingOptionIds={pendingToggleIds}
                noteLabel={NOTE_LABELS[activeFicheTab]}
                notePlaceholder={NOTE_PLACEHOLDERS[activeFicheTab]}
                onToggle={handleToggle}
                onSaveNote={handleSaveNote}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
