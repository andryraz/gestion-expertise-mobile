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

type AttachTarget = { zoneId?: string; buildingId?: string };

type Selection =
  | { kind: "building" }
  | { kind: "zone"; id: string; name: string };

type PhotoAttachModalProps = {
  visible: boolean;
  buildingId: string | null;
  isAttaching?: boolean;
  onClose: () => void;
  onAttach: (target: AttachTarget) => Promise<void>;
};

export function PhotoAttachModal({
  visible,
  buildingId,
  isAttaching = false,
  onClose,
  onAttach,
}: PhotoAttachModalProps) {
  const theme = useTheme();

  const [selection, setSelection] = useState<Selection | null>(null);

  const {
    data: tree = [],
    isLoading: isLoadingTree,
    error: treeError,
  } = useZonesTree(buildingId ?? "");

  const reset = () => setSelection(null);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectBuilding = () => setSelection({ kind: "building" });

  const handleSelectZone = (zone: ZoneTreeNode) =>
    setSelection({ kind: "zone", id: zone.id, name: zone.name });

  const handleConfirm = async () => {
    if (!selection) return;
    if (selection.kind === "building") {
      if (!buildingId) return;
      await onAttach({ buildingId });
    } else {
      await onAttach({ zoneId: selection.id });
    }
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
              {buildingId ? "Choisis une destination" : "Choisis une zone"}
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
            {selection ? (
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
                    {selection.kind === "building"
                      ? "Vue d'ensemble du bâtiment"
                      : selection.name}
                  </ThemedText>
                  <Pressable onPress={reset} hitSlop={8}>
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
              ListHeaderComponent={
                buildingId ? (
                  <>
                    <Pressable
                      onPress={handleSelectBuilding}
                      className={[
                        "flex-row items-center gap-two py-two pr-two mb-one",
                        selection?.kind === "building"
                          ? "bg-background-selected dark:bg-background-selected-dark rounded-two"
                          : "",
                      ].join(" ")}
                      style={{ paddingLeft: 8 }}
                    >
                      <Ionicons
                        name={
                          selection?.kind === "building"
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        color={
                          selection?.kind === "building"
                            ? theme.accent
                            : theme.textSecondary
                        }
                        size={18}
                      />
                      <Ionicons
                        name="business-outline"
                        color={theme.textSecondary}
                        size={16}
                      />
                      <ThemedText
                        type="smallBold"
                        themeColor={
                          selection?.kind === "building" ? "accent" : "text"
                        }
                        className="flex-1"
                      >
                        Vue d&apos;ensemble du bâtiment
                      </ThemedText>
                    </Pressable>

                    {options.length > 0 && (
                      <ThemedText
                        type="eyebrow"
                        themeColor="textSecondary"
                        className="pb-one pl-two"
                      >
                        Zones
                      </ThemedText>
                    )}
                  </>
                ) : null
              }
              renderItem={({ item: { node, depth } }) => {
                const isSelected =
                  selection?.kind === "zone" && selection.id === node.id;
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
                  selection
                    ? "Rattacher la photo"
                    : "Choisis d'abord une destination"
                }
                icon="link-outline"
                onPress={handleConfirm}
                disabled={!selection || isAttaching}
              />
            </View>
          </>
        )}
      </ThemedView>
    </Modal>
  );
}
