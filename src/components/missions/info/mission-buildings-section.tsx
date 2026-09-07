import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { Building } from "@/types/building";

import { BuildingCard } from "./building-card";
import { BuildingFormModal } from "./building-form-modal";

type MissionBuildingsSectionProps = {
  missionId: string;
  buildings: Building[];
  isArchived: boolean;
  missionStatus?: string;
  onChange?: (buildings: Building[]) => void;
};

type ModalMode = "create" | "edit";

export function MissionBuildingsSection({
  missionId,
  buildings: buildingsProp,
  isArchived,
  missionStatus,
  onChange,
}: MissionBuildingsSectionProps) {
  const theme = useTheme();
  const [buildings, setBuildings] = useState<Building[]>(buildingsProp);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  useEffect(() => {
    setBuildings(buildingsProp);
  }, [buildingsProp]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBuilding(null);
    setModalVisible(true);
  };

  const openEditModal = (building: Building) => {
    setModalMode("edit");
    setEditingBuilding(building);
    setModalVisible(true);
  };

  const handleSaved = (next: Building[]) => {
    setBuildings(next);
    onChange?.(next);
  };

  return (
    <View>
      <View className="flex-row items-center justify-between mb-two">
        <ThemedText type="eyebrow" themeColor="accent">
          Bâtiments
        </ThemedText>
        {!isArchived && (
          <Pressable
            onPress={openCreateModal}
            hitSlop={8}
            className="flex-row items-center gap-one"
          >
            <Ionicons name="add" color={theme.accent} size={16} />
            <ThemedText type="small" themeColor="accent">
              Ajouter
            </ThemedText>
          </Pressable>
        )}
      </View>

      {buildings.length === 0 ? (
        <View className="items-center py-six rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark">
          <Ionicons
            name="business-outline"
            color={theme.textSecondary}
            size={28}
          />
          <ThemedText themeColor="textSecondary" className="mt-two text-center">
            Aucun bâtiment renseigné
          </ThemedText>
          {!isArchived && (
            <Pressable
              onPress={openCreateModal}
              className="mt-three flex-row items-center gap-one rounded-three bg-accent px-four py-two"
            >
              <Ionicons name="add" color={theme.background} size={16} />
              <ThemedText type="smallBold" themeColor="background">
                + Ajouter un bâtiment
              </ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="gap-two">
          {buildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              isArchived={isArchived}
              onPress={() =>
                router.push({
                  pathname: "/buildings/[buildingId]/zones" as any,
                  params: {
                    buildingId: building.id,
                    isArchived: String(isArchived),
                    missionId,
                    missionStatus: missionStatus ?? "",
                  },
                })
              }
              onEdit={() => openEditModal(building)}
            />
          ))}
        </View>
      )}

      <BuildingFormModal
        visible={modalVisible}
        mode={modalMode}
        building={editingBuilding}
        missionId={missionId}
        currentBuildings={buildings}
        onClose={() => {
          setModalVisible(false);
          setEditingBuilding(null);
        }}
        onSaved={handleSaved}
      />
    </View>
  );
}
