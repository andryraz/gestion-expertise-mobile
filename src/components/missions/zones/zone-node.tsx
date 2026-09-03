import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ZONE_TYPE_ICONS } from "@/constants/zone-labels";
import { useTheme } from "@/hooks/use-theme";
import type { ZoneTreeNode } from "@/types/zone";

const INDENT_PER_DEPTH = 18;

type ZoneNodeProps = {
  zone: ZoneTreeNode;
  depth: number;
  isArchived: boolean;
  onMenuPress: (zone: ZoneTreeNode) => void;
};

export const ZoneNode = memo(function ZoneNode({
  zone,
  depth,
  isArchived,
  onMenuPress,
}: ZoneNodeProps) {
  const theme = useTheme();
  const hasChildren = zone.children.length > 0;
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <View>
      <Pressable
        onPress={() => {
          if (hasChildren) setExpanded((prev) => !prev);
        }}
        disabled={!hasChildren}
        className="flex-row items-center gap-one py-two pr-two"
        style={{ paddingLeft: depth * INDENT_PER_DEPTH }}
      >
        <View className="w-four items-center justify-center">
          {hasChildren && (
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-forward"}
              color={theme.textSecondary}
              size={14}
            />
          )}
        </View>

        <Ionicons
          name={ZONE_TYPE_ICONS[zone.zoneType]}
          color={theme.textSecondary}
          size={16}
        />

        <ThemedText type="smallBold" numberOfLines={1} className="flex-1">
          {zone.name}
        </ThemedText>

        {!isArchived && (
          <Pressable
            onPress={() => onMenuPress(zone)}
            hitSlop={8}
            className="p-one"
          >
            <Ionicons
              name="ellipsis-horizontal"
              color={theme.textSecondary}
              size={18}
            />
          </Pressable>
        )}
      </Pressable>

      {expanded && hasChildren && (
        <View>
          {zone.children.map((child) => (
            <ZoneNode
              key={child.id}
              zone={child}
              depth={depth + 1}
              isArchived={isArchived}
              onMenuPress={onMenuPress}
            />
          ))}
        </View>
      )}
    </View>
  );
});
