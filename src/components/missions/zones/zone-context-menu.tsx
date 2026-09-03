import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ZONE_TYPE_ICONS, ZONE_TYPE_LABELS } from "@/constants/zone-labels";
import { useTheme } from "@/hooks/use-theme";
import type { ZoneTreeNode } from "@/types/zone";

type ZoneContextMenuProps = {
  zone: ZoneTreeNode | null;
  onClose: () => void;
  onAddSubzone: (zone: ZoneTreeNode) => void;
  onEdit: (zone: ZoneTreeNode) => void;
  onMove: (zone: ZoneTreeNode) => void;
  onDelete: (zone: ZoneTreeNode) => void;
};

export function ZoneContextMenu({
  zone,
  onClose,
  onAddSubzone,
  onEdit,
  onMove,
  onDelete,
}: ZoneContextMenuProps) {
  const theme = useTheme();

  if (!zone) return null;

  return (
    <Pressable className="absolute inset-0 z-50 justify-end" onPress={onClose}>
      <View className="absolute inset-0 bg-black/50" />

      <ThemedView
        type="background"
        className="rounded-t-three border-t border-border dark:border-border-dark px-four pt-four pb-20"
      >
        <View className="flex-row items-center gap-three mb-three">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
            <Ionicons name={ZONE_TYPE_ICONS[zone.zoneType]} color={theme.accent} size={18} />
          </View>
          <View className="flex-1">
            <ThemedText type="smallBold" numberOfLines={1}>
              {zone.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {ZONE_TYPE_LABELS[zone.zoneType]}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={() => onAddSubzone(zone)}
          className="flex-row items-center gap-three rounded-two px-two py-three active:opacity-70"
        >
          <Ionicons name="add" color={theme.text} size={20} />
          <ThemedText type="default" className="flex-1">
            Ajouter une sous-zone ici
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => onEdit(zone)}
          className="flex-row items-center gap-three rounded-two px-two py-three active:opacity-70"
        >
          <Ionicons name="pencil" color={theme.text} size={20} />
          <ThemedText type="default" className="flex-1">
            Renommer / changer le type
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => onMove(zone)}
          className="flex-row items-center gap-three rounded-two px-two py-three active:opacity-70"
        >
          <Ionicons name="swap-horizontal" color={theme.text} size={20} />
          <ThemedText type="default" className="flex-1">
            Déplacer vers...
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => onDelete(zone)}
          className="flex-row items-center gap-three rounded-two px-two py-three active:opacity-70"
        >
          <Ionicons name="trash-outline" color={theme.danger} size={20} />
          <ThemedText type="default" themeColor="danger" className="flex-1">
            Supprimer
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={onClose}
          className="mt-two items-center rounded-three bg-background-element dark:bg-background-element-dark py-three"
        >
          <ThemedText type="smallBold" themeColor="textSecondary">
            Annuler
          </ThemedText>
        </Pressable>
      </ThemedView>
    </Pressable>
  );
}