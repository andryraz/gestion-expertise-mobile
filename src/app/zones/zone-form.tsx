import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
  ZONE_TYPE_ICONS,
  ZONE_TYPE_LABELS,
  ZONE_TYPES,
} from "@/constants/zone-labels";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { createZone, updateZone } from "@/services/zone-services";
import type { ZoneType } from "@/types/zone";
import { logger } from "@/utils/logger";

type FormParams = {
  buildingId: string;
  mode: "create" | "edit";
  zoneId?: string;
  parentZoneId?: string;
  parentZoneName?: string;
  zoneName?: string;
  zoneType?: string;
};

export default function ZoneFormScreen() {
  const params = useLocalSearchParams<FormParams>();
  const theme = useTheme();
  const isEdit = params.mode === "edit";

  const [name, setName] = useState(isEdit ? (params.zoneName ?? "") : "");
  const [zoneType, setZoneType] = useState<ZoneType>(() => {
    if (isEdit) return (params.zoneType as ZoneType) ?? "PIECE";
    return params.parentZoneId ? "PIECE" : "ETAGE";
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom de la zone est obligatoire");
      return;
    }
    setIsSaving(true);
    try {
      if (isEdit && params.zoneId) {
        await updateZone(params.zoneId, {
          name: name.trim(),
          zoneType,
        });
        logger.info("Zones", "Zone modifiée", { id: params.zoneId });
      } else {
        await createZone(params.buildingId, {
          name: name.trim(),
          zoneType,
          parentZoneId: params.parentZoneId ?? null,
        });
        logger.info("Zones", "Zone créée", {
          buildingId: params.buildingId,
          parentZoneId: params.parentZoneId ?? null,
        });
      }
      router.back();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'enregistrer la zone";
      Alert.alert("Erreur", message);
      logger.error("Zones", `Échec de ${isEdit ? "modification" : "création"}`, {
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade className="flex-1">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-row items-center gap-two px-four pt-three pb-four">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" color={theme.text} size={24} />
              </Pressable>
              <ThemedText
                type="smallBold"
                className="text-xl flex-1"
                themeColor="accent"
              >
                {isEdit ? "Modifier la zone" : "Nouvelle zone"}
              </ThemedText>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-four pb-20"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Zone parente
                </ThemedText>
                <ThemedView
                  type="backgroundElement"
                  className="flex-row items-center gap-two rounded-three border border-border dark:border-border-dark px-three py-three"
                >
                  <Ionicons
                    name={
                      params.parentZoneName
                        ? "git-branch-outline"
                        : "home-outline"
                    }
                    color={theme.textSecondary}
                    size={16}
                  />
                  <ThemedText type="default" className="flex-1">
                    {params.parentZoneName || "Racine"}
                  </ThemedText>
                  <Ionicons
                    name="lock-closed-outline"
                    color={theme.textSecondary}
                    size={14}
                  />
                </ThemedView>
              </View>

              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Nom de la zone *
                </ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Rez-de-chaussée, Salon, Mur nord..."
                  placeholderTextColor={theme.textSecondary}
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                  autoCapitalize="sentences"
                />
              </View>

              <View className="mb-four">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-two"
                >
                  Type de zone *
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex-row gap-two"
                >
                  {ZONE_TYPES.map((t) => {
                    const isActive = t === zoneType;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setZoneType(t)}
                        className={[
                          "rounded-five border px-three py-two",
                          isActive
                            ? "border-accent bg-accent"
                            : "border-border bg-background-element dark:border-border-dark dark:bg-background-element-dark",
                        ].join(" ")}
                      >
                        <View className="flex-row items-center gap-one">
                          <Ionicons
                            name={ZONE_TYPE_ICONS[t]}
                            color={
                              isActive ? theme.background : theme.textSecondary
                            }
                            size={14}
                          />
                          <ThemedText
                            type="smallBold"
                            themeColor={
                              isActive ? "background" : "textSecondary"
                            }
                            numberOfLines={1}
                          >
                            {ZONE_TYPE_LABELS[t]}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <PrimaryButton
                label={
                  isEdit ? "Enregistrer les modifications" : "Créer la zone"
                }
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
                loadingLabel="Enregistrement..."
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}