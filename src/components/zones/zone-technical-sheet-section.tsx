import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
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
  useCopyFromParent,
  useOuvrageCatalog,
  useToggleTechnicalSelection,
  useUpdateTechnicalSelection,
  useZoneTechnicalSelections,
} from "@/queries/technical-sheets";
import { ApiError } from "@/services/api-client";
import type { FicheType, TechnicalSelection } from "@/types/technical-sheet";
import { logger } from "@/utils/logger";

type ZoneTechnicalSheetSectionProps = {
  zoneId: string;
  buildingId: string;
  /** Statut de la mission : édition réservée à EN_COURS. */
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
 * Fiche technique d'une zone (n'importe quelle profondeur de sous-zone) :
 * mêmes accords catalogues / cases / notes que la fiche du bâtiment, mais
 * les sélections sont propres à la zone. L'héritage du niveau au-dessus
 * (zone parente, ou bâtiment pour une zone racine) se fait par copie
 * explicite, déclenchée automatiquement à chaque ouverture de la fiche
 * (pas de bouton manuel : l'utilisateur n'a rien à faire).
 */
export function ZoneTechnicalSheetSection({
  zoneId,
  buildingId,
  missionStatus,
}: ZoneTechnicalSheetSectionProps) {
  const archived =
    useLocalSearchParams<{ isArchived?: string }>().isArchived === "true";
  // Backends récents exigent une mission EN_COURS pour cocher/décocher ;
  // la copie n'est bloquée que si la mission est archivée.
  const missionAllowsEdit = !missionStatus || missionStatus === "EN_COURS";
  const canEdit = !archived && missionAllowsEdit;
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<FicheType>("GROS_OEUVRE");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

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
  } = useZoneTechnicalSelections(zoneId);

  const toggleMutation = useToggleTechnicalSelection({
    kind: "zone",
    zoneId,
    buildingId,
  });
  const updateNoteMutation = useUpdateTechnicalSelection({
    kind: "zone",
    zoneId,
    buildingId,
  });
  const copyMutation = useCopyFromParent(zoneId);

  // Toggles en vol, par option : seule la ligne concernée est verrouillée
  // (anti double-tap) ; les autres cases restent cliquables.
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

  /**
   * Copie automatique du niveau parent à l'ouverture de la fiche. Le
   * verrou module-scope dans useCopyFromParent garantit qu'un seul appel
   * part même si le focus et le bouton se croisent.
   */
  const runAutoCopy = useCallback(async () => {
    setCopyError(null);
    try {
      const result = await copyMutation.mutateAsync();
      if (result === null) return; // Appel doublonné : no-op.
      if (result.copiedCount > 0) {
        setCopyNotice(
          `${result.copiedCount} élément${result.copiedCount > 1 ? "s" : ""} copié${result.copiedCount > 1 ? "s" : ""} du niveau parent`,
        );
      } else {
        setCopyNotice(null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Course entre deux copies concurrentes : le backend a déjà
        // créé les lignes, on resynchronise silencieusement.
        logger.warn(
          "TechnicalSheet",
          "409 : copie concurrente déjà effectuée, resynchronisation",
          { zoneId },
        );
        queryClient.invalidateQueries({
          queryKey: technicalSheetKeys.zoneSelections(zoneId),
        });
      } else {
        const message =
          err instanceof ApiError
            ? err.message
            : "Impossible de copier les sélections du niveau parent";
        logger.error("TechnicalSheet", "Échec de la copie depuis le parent", {
          zoneId,
          message,
        });
        setCopyError(message);
      }
    }
  }, [copyMutation.mutateAsync, zoneId]);

  // Déclenchement automatique de la copie à chaque ouverture de la fiche
  // (focus de l'écran hôte). Refetch des sélections en parallèle pour
  // resynchroniser l'affichage avec le backend.
  useFocusEffect(
    useCallback(() => {
      refetchSelections();
      runAutoCopy();
    }, [refetchSelections, runAutoCopy]),
  );

  const handleToggle = useCallback(
    async (materialOptionId: string, checked: boolean) => {
      if (!canEdit || pendingToggleIdsRef.current.has(materialOptionId)) return;

      // Recroisement côté client : on cherche la sélection existante
      // pour décider de l'action (POST vs DELETE).
      const selection = findSelectionByMaterialOptionId(
        queryClient.getQueryData<TechnicalSelection[]>(
          technicalSheetKeys.zoneSelections(zoneId),
        ),
        materialOptionId,
      );

      // Garde-fou : l'état de la case peut avoir changé entre le rendu
      // et le tap (double-tap rapide).
      if (checked !== !!selection) {
        logger.warn(
          "TechnicalSheet",
          "État de la case incohérent avec le cache, action ignorée",
          { zoneId, materialOptionId, checked },
        );
        return;
      }

      setTogglePending(materialOptionId, true);
      try {
        await toggleMutation.mutateAsync({ materialOptionId, selection });
        logger.info(
          "TechnicalSheet",
          selection ? "Matériau décoché" : "Matériau coché",
          { zoneId, materialOptionId },
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Double-tap rapide : la sélection existe déjà côté backend.
          // Pas d'erreur alarmante, on resynchronise silencieusement.
          logger.warn(
            "TechnicalSheet",
            "409 : option déjà cochée pour cette zone, resynchronisation",
            { zoneId, materialOptionId },
          );
          queryClient.invalidateQueries({
            queryKey: technicalSheetKeys.zoneSelections(zoneId),
          });
        } else {
          const message =
            err instanceof ApiError
              ? err.message
              : "Impossible d'enregistrer la sélection";
          logger.error("TechnicalSheet", "Échec du toggle", {
            zoneId,
            materialOptionId,
            message,
          });
          setToggleError(message);
        }
      } finally {
        setTogglePending(materialOptionId, false);
      }
    },
    [canEdit, setTogglePending, toggleMutation, zoneId],
  );

  const handleSaveNote = useCallback(
    (selectionId: string, note: string | null) => {
      updateNoteMutation.mutate(
        { selectionId, payload: { note } },
        {
          onSuccess: () =>
            logger.info("TechnicalSheet", "Note enregistrée", {
              zoneId,
              selectionId,
            }),
          onError: (err) =>
            logger.error(
              "TechnicalSheet",
              "Échec de l'enregistrement de la note",
              {
                zoneId,
                selectionId,
                message: err instanceof Error ? err.message : err,
              },
            ),
        },
      );
    },
    [updateNoteMutation, zoneId],
  );

  const dismissToggleError = () => setToggleError(null);
  const dismissCopyError = () => setCopyError(null);

  const isLoadingAnything = isLoadingCatalog || isLoadingSelections;

  return (
    <View className="mb-four">
      <View className="flex-row items-center justify-between mb-two">
        <ThemedText type="eyebrow" themeColor="accent">
          Fiche technique
        </ThemedText>
      </View>

      <View className="mb-three">
        <SegmentedControl
          options={FICHE_TABS}
          value={activeTab}
          onChange={(key) => setActiveTab(key as FicheType)}
        />
      </View>

      {copyNotice && (
        <View className="mb-two flex-row items-center gap-two rounded-two border border-success/40 bg-success/10 px-three py-two">
          <Ionicons name="copy-outline" color={theme.success} size={16} />
          <ThemedText type="small" themeColor="success" className="flex-1">
            {copyNotice}
          </ThemedText>
          <Pressable onPress={() => setCopyNotice(null)} hitSlop={8}>
            <Ionicons name="close" color={theme.success} size={16} />
          </Pressable>
        </View>
      )}

      {copyError && (
        <View className="mb-two flex-row items-center gap-two rounded-two border border-danger/40 bg-danger/10 px-three py-two">
          <Ionicons name="copy-outline" color={theme.danger} size={16} />
          <ThemedText type="small" themeColor="danger" className="flex-1">
            {copyError}
          </ThemedText>
          <Pressable onPress={dismissCopyError} hitSlop={8}>
            <Ionicons name="close" color={theme.danger} size={16} />
          </Pressable>
        </View>
      )}

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
                noteLabel={NOTE_LABELS[activeTab]}
                notePlaceholder={NOTE_PLACEHOLDERS[activeTab]}
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
