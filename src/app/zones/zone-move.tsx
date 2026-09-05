import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ZONE_TYPE_ICONS } from "@/constants/zone-labels";
import { useTheme } from "@/hooks/use-theme";
import { useUpdateZone, useZonesTree } from "@/queries/zones";
import { ApiError } from "@/services/api-client";
import { logger } from "@/utils/logger";
import {
  collectDescendantIds,
  findZoneNode,
  flattenTree,
} from "@/utils/zone-tree";

type MoveParams = {
  buildingId: string;
  zoneId: string;
  zoneName?: string;
};

export default function MoveZoneScreen() {
  const { buildingId, zoneId, zoneName } = useLocalSearchParams<MoveParams>();
  const theme = useTheme();

  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Même clé de requête ["zones", buildingId] que zones.tsx : si l'écran
  // précédent a déjà chargé l'arbre, il est disponible ici immédiatement
  // (React Query partage le cache), pendant qu'un refetch de fraîcheur
  // tourne en arrière-plan.
  const {
    data: tree = [],
    isLoading,
    error: queryError,
  } = useZonesTree(buildingId);
  const updateZoneMutation = useUpdateZone(buildingId);

  const storeError = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger les zones"
    : null;

  // Dérive la sélection initiale (parent actuel de la zone) une seule fois,
  // dès que le premier chargement est terminé. `initializedRef` évite que
  // ce calcul se refasse si `tree` change ensuite pour une autre raison
  // (ex: refetch de fraîcheur) et écrase la sélection en cours de
  // l'utilisateur.
  const initializedRef = useRef(false);
  useEffect(() => {
    initializedRef.current = false;
  }, [buildingId, zoneId]);

  useEffect(() => {
    if (isLoading || initializedRef.current) return;
    initializedRef.current = true;

    const node = findZoneNode(tree, zoneId);
    if (!node) {
      setNotFoundError("Zone introuvable dans ce bâtiment");
      return;
    }
    setCurrentParent(node.parentZoneId);
    setSelected(node.parentZoneId);
  }, [isLoading, tree, zoneId]);

  const displayError = storeError ?? notFoundError;

  const disabledIds = useMemo(() => {
    const node = findZoneNode(tree, zoneId);
    if (!node) return new Set<string>([zoneId]);
    return new Set([zoneId, ...collectDescendantIds(node)]);
  }, [tree, zoneId]);

  const options = useMemo(() => flattenTree(tree), [tree]);

  const handleConfirm = async () => {
    if (selected === currentParent) return;
    try {
      await updateZoneMutation.mutateAsync({
        zoneId,
        payload: { parentZoneId: selected },
      });
      logger.info("Zones", "Zone déplacée", {
        id: zoneId,
        parentZoneId: selected,
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible de déplacer la zone";
      Alert.alert("Erreur", message);
      logger.error("Zones", "Échec du déplacement de la zone", {
        id: zoneId,
        message,
      });
    }
  };

  const renderOption = (
    value: string | null,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    depth: number,
    disabled: boolean,
  ) => {
    const isSelected = selected === value;
    return (
      <Pressable
        key={value ?? "root"}
        onPress={() => setSelected(value)}
        disabled={disabled}
        className={[
          "flex-row items-center gap-two py-three",
          disabled ? "opacity-40" : "",
        ].join(" ")}
        style={{ paddingLeft: depth * 18 }}
      >
        <Ionicons
          name={isSelected ? "radio-button-on" : "radio-button-off"}
          color={isSelected ? theme.accent : theme.textSecondary}
          size={18}
        />
        <Ionicons name={icon} color={theme.textSecondary} size={16} />
        <ThemedText
          type="smallBold"
          themeColor={isSelected ? "accent" : "text"}
          className="flex-1"
          numberOfLines={1}
        >
          {label}
        </ThemedText>
        {disabled && (
          <Ionicons
            name="lock-closed-outline"
            color={theme.textSecondary}
            size={14}
          />
        )}
      </Pressable>
    );
  };

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
                Déplacer la zone
              </ThemedText>
              <ThemedText
                type="smallBold"
                numberOfLines={1}
                className="text-xl leading-7"
              >
                {zoneName ?? "Zone"}
              </ThemedText>
            </View>
          </View>

          {isLoading && (
            <ThemedText themeColor="textSecondary" className="px-four py-four">
              Chargement...
            </ThemedText>
          )}

          {displayError && !isLoading && (
            <ThemedText themeColor="danger" className="px-four py-four">
              {displayError}
            </ThemedText>
          )}

          {!isLoading && !displayError && (
            <>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                className="px-four pb-two"
              >
                Les zones grisées ne peuvent pas être sélectionnées (la zone et
                ses sous-zones).
              </ThemedText>

              <ScrollView
                className="flex-1"
                contentContainerClassName="px-four pb-20"
                showsVerticalScrollIndicator={false}
              >
                <View className="border-b border-border dark:border-border-dark">
                  {renderOption(
                    null,
                    "Racine (aucun parent)",
                    "home-outline",
                    0,
                    false,
                  )}
                </View>

                {options.map(({ node, depth }) =>
                  renderOption(
                    node.id,
                    node.name,
                    ZONE_TYPE_ICONS[node.zoneType],
                    depth + 1,
                    disabledIds.has(node.id),
                  ),
                )}
              </ScrollView>

              <View className="border-t border-border px-four py-three dark:border-border-dark">
                <PrimaryButton
                  label="Déplacer ici"
                  onPress={handleConfirm}
                  disabled={
                    updateZoneMutation.isPending || selected === currentParent
                  }
                  loading={updateZoneMutation.isPending}
                  loadingLabel="Déplacement..."
                />
              </View>
            </>
          )}
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
