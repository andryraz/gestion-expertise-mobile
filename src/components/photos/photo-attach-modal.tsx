import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ZONE_TYPE_ICONS } from "@/constants/zone-labels";
import { useTheme } from "@/hooks/use-theme";
import { useZonesTree } from "@/queries/zones";
import { ApiError } from "@/services/api-client";
import type { ZoneTreeNode } from "@/types/zone";
import { flattenTree } from "@/utils/zone-tree";

type PhotoAttachModalProps = {
  visible: boolean;
  buildingId: string | null;
  isAttaching?: boolean;
  onClose: () => void;
  onAttach: (zoneId: string) => Promise<void>;
};

export function PhotoAttachModal({
  visible,
  buildingId,
  isAttaching = false,
  onClose,
  onAttach,
}: PhotoAttachModalProps) {
  const theme = useTheme();

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedZoneName, setSelectedZoneName] = useState<string | null>(null);

  const {
    data: tree = [],
    isLoading: isLoadingTree,
    error: treeError,
  } = useZonesTree(buildingId ?? "");

  const reset = () => {
    setSelectedZoneId(null);
    setSelectedZoneName(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectZone = (zone: ZoneTreeNode) => {
    setSelectedZoneId(zone.id);
    setSelectedZoneName(zone.name);
  };

  const handleConfirm = async () => {
    if (!selectedZoneId) return;
    await onAttach(selectedZoneId);
  };

  const options = flattenTree(tree);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView className="flex-1">
        <View className="flex-row items-center gap-two px-four pt-four pb-two">
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="chevron-back" color={theme.text} size={24} />
          </Pressable>
          <View className="flex-1">
            <ThemedText
              type="smallBold"
              className="text-xl"
              themeColor="accent"
            >
              Classer la photo
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choisis une zone
            </ThemedText>
          </View>
        </View>

        {isLoadingTree && (
          <View className="items-center py-six">
            <ActivityIndicator color={theme.accent} />
          </View>
        )}

        {!!treeError && (
          <ThemedText themeColor="danger" className="px-four py-three">
            {treeError instanceof ApiError
              ? treeError.message
              : "Impossible de charger les zones"}
          </ThemedText>
        )}

        {!isLoadingTree && !treeError && (
          <>
            {selectedZoneId ? (
              <View className="px-four pb-two">
                <ThemedView
                  type="backgroundElement"
                  className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark px-three py-two"
                >
                  <Ionicons
                    name="checkmark-circle"
                    color={theme.success}
                    size={16}
                  />
                  <ThemedText type="smallBold" className="flex-1">
                    {selectedZoneName}
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      setSelectedZoneId(null);
                      setSelectedZoneName(null);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      color={theme.textSecondary}
                      size={18}
                    />
                  </Pressable>
                </ThemedView>
              </View>
            ) : null}

            <FlatList
              data={options}
              keyExtractor={({ node }) => node.id}
              contentContainerClassName="px-four pb-four"
              showsVerticalScrollIndicator={false}
              renderItem={({ item: { node, depth } }) => {
                const isSelected = selectedZoneId === node.id;
                return (
                  <Pressable
                    onPress={() => handleSelectZone(node)}
                    className={[
                      "flex-row items-center gap-two py-two pr-two",
                      isSelected
                        ? "bg-background-selected dark:bg-background-selected-dark rounded-two"
                        : "",
                    ].join(" ")}
                    style={{ paddingLeft: depth * 18 + 8 }}
                  >
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      color={isSelected ? theme.accent : theme.textSecondary}
                      size={18}
                    />
                    <Ionicons
                      name={ZONE_TYPE_ICONS[node.zoneType]}
                      color={theme.textSecondary}
                      size={16}
                    />
                    <ThemedText
                      type="smallBold"
                      themeColor={isSelected ? "accent" : "text"}
                      className="flex-1"
                      numberOfLines={1}
                    >
                      {node.name}
                    </ThemedText>
                  </Pressable>
                );
              }}
            />

            <View className="border-t border-border px-four py-three dark:border-border-dark">
              <PrimaryButton
                label={
                  selectedZoneId
                    ? "Rattacher la photo"
                    : "Choisis d'abord une zone"
                }
                icon="link-outline"
                onPress={handleConfirm}
                disabled={!selectedZoneId || isAttaching}
              />
            </View>
          </>
        )}
      </ThemedView>
    </Modal>
  );
}
