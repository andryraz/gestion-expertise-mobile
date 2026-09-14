import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BuildingTechnicalSheetTab } from "@/components/buildings/technical-sheet/building-technical-sheet-tab";
import {
  SegmentedControl,
  type TabOption,
} from "@/components/missions/segmented-control";
import { ZoneContextMenu } from "@/components/missions/zones/zone-context-menu";
import { ZoneNode } from "@/components/missions/zones/zone-node";
import { UnclassifiedPhotosSheet } from "@/components/photos/unclassified-photos-sheet";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { usePhotoCapture } from "@/hooks/use-photo-capture";
import { useTheme } from "@/hooks/use-theme";
import { useCreatePhoto, useMissionPhotos } from "@/queries/photos";
import { useDeleteZone, useZonesTree } from "@/queries/zones";
import { ApiError } from "@/services/api-client";
import { getBuilding } from "@/services/building-services";
import { usePendingPhotosStore } from "@/store/pending-photos-store";
import type { Building } from "@/types/building";
import type { ZoneTreeNode } from "@/types/zone";
import { logger } from "@/utils/logger";
import { countDescendants, findZoneNode } from "@/utils/zone-tree";

type TreeParams = {
  buildingId: string;
  isArchived?: string;
  missionId?: string;
  missionStatus?: string;
};

type BuildingTabKey = "zones" | "fiche" | "mesures";

const BUILDING_TABS: TabOption[] = [
  { key: "zones", label: "Zones" },
  { key: "fiche", label: "Fiche technique" },
  { key: "mesures", label: "Mesures", disabled: true },
];

export default function ZonesTreeScreen() {
  const { buildingId, isArchived, missionId, missionStatus } =
    useLocalSearchParams<TreeParams>();
  const archived = isArchived === "true";
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<BuildingTabKey>("zones");
  const [building, setBuilding] = useState<Building | null>(null);
  const [menuZone, setMenuZone] = useState<ZoneTreeNode | null>(null);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addPending = usePendingPhotosStore((state) => state.addPending);

  const {
    data: tree = [],
    isLoading,
    error: queryError,
    refetch,
  } = useZonesTree(buildingId);
  const deleteZoneMutation = useDeleteZone(buildingId);

  const { data: photos = [] } = useMissionPhotos(missionId ?? "");
  const createPhotoMutation = useCreatePhoto(missionId ?? "");
  const { capture, isCapturing } = usePhotoCapture();

  const unclassifiedCount = useMemo(
    () =>
      photos.filter(
        (photo) => !photo.zoneId && !photo.id.startsWith("pending-"),
      ).length,
    [photos],
  );

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger les zones"
    : null;

  const loadBuilding = useCallback(async () => {
    if (!buildingId) return;
    try {
      const result = await getBuilding(buildingId);
      setBuilding(result);
    } catch (err) {
      logger.error("Zones", "Impossible de charger le bâtiment", {
        buildingId,
        message: err instanceof Error ? err.message : err,
      });
    }
  }, [buildingId]);

  useFocusEffect(
    useCallback(() => {
      loadBuilding();
      refetch();
    }, [loadBuilding, refetch]),
  );

  const handleOpenZone = useCallback(
    (zone: ZoneTreeNode) => {
      router.push({
        pathname: "/zones/[zoneId]" as any,
        params: {
          buildingId,
          missionId: missionId ?? "",
          zoneId: zone.id,
          missionStatus: missionStatus ?? "",
        },
      });
    },
    [buildingId, missionId, missionStatus],
  );

  const handleAddRoot = () => {
    router.push({
      pathname: "/zones/zone-form" as any,
      params: { buildingId, mode: "create" },
    });
  };

  const handleAddSubzone = useCallback(
    (zone: ZoneTreeNode) => {
      setMenuZone(null);
      router.push({
        pathname: "/zones/zone-form" as any,
        params: {
          buildingId,
          mode: "create",
          parentZoneId: zone.id,
          parentZoneName: zone.name,
        },
      });
    },
    [buildingId],
  );

  const handleEdit = useCallback(
    (zone: ZoneTreeNode) => {
      setMenuZone(null);
      const parentName = zone.parentZoneId
        ? findZoneNode(tree, zone.parentZoneId)?.name
        : undefined;
      router.push({
        pathname: "/zones/zone-form" as any,
        params: {
          buildingId,
          mode: "edit",
          zoneId: zone.id,
          zoneName: zone.name,
          zoneType: zone.zoneType,
          parentZoneName: parentName,
        },
      });
    },
    [buildingId, tree],
  );

  const handleMove = useCallback(
    (zone: ZoneTreeNode) => {
      setMenuZone(null);
      router.push({
        pathname: "/zones/zone-move" as any,
        params: { buildingId, zoneId: zone.id, zoneName: zone.name },
      });
    },
    [buildingId],
  );

  const canCapture = !archived && missionStatus === "EN_COURS";

  const handleCaptureFree = useCallback(async () => {
    if (!missionId) return;
    setUploadError(null);
    const uri = await capture();
    if (!uri) return;

    try {
      await createPhotoMutation.mutateAsync({ uri });
      logger.info("Photos", "Photo capturée (libre)", { missionId });
      setShowUnclassified(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'envoyer la photo. Vérifie ta connexion.";
      addPending({ missionId, zoneId: null, uri });
      setUploadError(message);
      setShowUnclassified(true);
      logger.error("Photos", "Échec upload photo libre", {
        missionId,
        message,
      });
    }
  }, [addPending, capture, createPhotoMutation, missionId]);

  const handleDelete = useCallback(
    (zone: ZoneTreeNode) => {
      setMenuZone(null);
      const subzones = countDescendants(zone);
      const message =
        subzones > 0
          ? `"${zone.name}" et ses ${subzones} sous-zone${
              subzones > 1 ? "s" : ""
            } seront définitivement supprimées. Les photos et mesures associées seront conservées mais déclassées (plus rattachées à cette zone).`
          : `"${zone.name}" sera définitivement supprimée. Les photos et mesures associées seront conservées mais déclassées.`;

      Alert.alert("Supprimer cette zone ?", message, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteZoneMutation.mutateAsync(zone.id);
              logger.info("Zones", "Zone supprimée", {
                id: zone.id,
                subzones,
              });
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de supprimer la zone";
              Alert.alert("Erreur", msg);
              logger.error("Zones", "Échec de la suppression de la zone", {
                id: zone.id,
                message: msg,
              });
            }
          },
        },
      ]);
    },
    [deleteZoneMutation],
  );

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
                Bâtiment
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

          <View className="pb-three">
            <SegmentedControl
              options={BUILDING_TABS}
              value={activeTab}
              onChange={(key) => setActiveTab(key as BuildingTabKey)}
            />
          </View>

          {activeTab === "zones" && (
            <>
              {isLoading && (
                <ThemedText
                  themeColor="textSecondary"
                  className="px-four py-four"
                >
                  Chargement...
                </ThemedText>
              )}

              {error && !isLoading && (
                <ThemedText themeColor="danger" className="px-four py-four">
                  {error}
                </ThemedText>
              )}

              {!isLoading && !error && tree.length === 0 && (
                <View className="items-center px-four py-six">
                  <Ionicons
                    name="git-branch-outline"
                    color={theme.textSecondary}
                    size={32}
                  />
                  <ThemedText
                    themeColor="textSecondary"
                    className="mt-two text-center"
                  >
                    Aucune zone pour ce bâtiment
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    className="mt-one text-center"
                  >
                    Ajoutez un étage, une pièce, une façade...
                  </ThemedText>
                  {!archived && (
                    <Pressable
                      onPress={handleAddRoot}
                      className="mt-three flex-row items-center gap-one rounded-three bg-accent px-four py-two"
                    >
                      <Ionicons name="add" color={theme.background} size={16} />
                      <ThemedText type="smallBold" themeColor="background">
                        + Ajouter une zone racine
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              )}

              {!isLoading && !error && tree.length > 0 && (
                <ScrollView
                  className="flex-1"
                  contentContainerClassName="px-four pb-20"
                  showsVerticalScrollIndicator={false}
                >
                  {tree.map((root) => (
                    <ZoneNode
                      key={root.id}
                      zone={root}
                      depth={0}
                      isArchived={archived}
                      onMenuPress={setMenuZone}
                      onZonePress={handleOpenZone}
                    />
                  ))}
                </ScrollView>
              )}

              {!isLoading && !error && tree.length > 0 && !archived && (
                <View className="border-t border-border px-four py-three dark:border-border-dark">
                  <PrimaryButton
                    label="Ajouter une zone racine"
                    icon="add"
                    onPress={handleAddRoot}
                  />
                </View>
              )}
            </>
          )}

          {activeTab === "fiche" && (
            <View className="flex-1 px-four">
              <BuildingTechnicalSheetTab
                buildingId={buildingId}
                isArchived={archived}
                missionStatus={missionStatus}
              />
            </View>
          )}
        </ScreenFade>

        {uploadError && (
          <View className="absolute bottom-24 left-four right-four rounded-three border border-danger/40 bg-danger/10 px-three py-two">
            <View className="flex-row items-center gap-two">
              <Ionicons
                name="cloud-offline-outline"
                color={theme.danger}
                size={16}
              />
              <ThemedText type="small" themeColor="danger" className="flex-1">
                {uploadError} La photo reste enregistrée dans « Photos non
                classées » de la mission.
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setUploadError(null)}
              className="mt-one self-end"
              hitSlop={8}
            >
              <ThemedText type="smallBold" themeColor="danger">
                Fermer
              </ThemedText>
            </Pressable>
          </View>
        )}

        <UnclassifiedPhotosSheet
          visible={showUnclassified}
          missionId={missionId ?? ""}
          buildingId={buildingId}
          photos={photos}
          onClose={() => {
            setShowUnclassified(false);
            setUploadError(null);
          }}
        />
      </SafeAreaView>

      <ZoneContextMenu
        zone={menuZone}
        onClose={() => setMenuZone(null)}
        onAddSubzone={handleAddSubzone}
        onEdit={handleEdit}
        onMove={handleMove}
        onDelete={handleDelete}
      />
    </ThemedView>
  );
}
