import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import {
  createBuilding,
  deleteBuilding,
  updateBuilding,
} from "@/services/building-services";
import type {
  Building,
  CreateBuildingPayload,
  UpdateBuildingPayload,
} from "@/types/building";

type ModalMode = "create" | "edit";

type BuildingFormModalProps = {
  visible: boolean;
  mode: ModalMode;
  building: Building | null;
  missionId: string;
  onClose: () => void;
  onSaved: (buildings: Building[]) => void;
  currentBuildings: Building[];
};

export function BuildingFormModal({
  visible,
  mode,
  building,
  missionId,
  onClose,
  onSaved,
  currentBuildings,
}: BuildingFormModalProps) {
  const theme = useTheme();
  const {
    getCurrentLocation,
    loading: locationLoading,
    error: locationError,
  } = useCurrentLocation();

  const [name, setName] = React.useState(building?.name ?? "");
  const [address, setAddress] = React.useState(building?.address ?? "");
  const [buildingType, setBuildingType] = React.useState(
    building?.buildingType ?? "",
  );
  const [lat, setLat] = React.useState(
    building?.gpsLat != null ? String(building.gpsLat) : "",
  );
  const [lng, setLng] = React.useState(
    building?.gpsLng != null ? String(building.gpsLng) : "",
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && building) {
      setName(building.name);
      setAddress(building.address ?? "");
      setBuildingType(building.buildingType ?? "");
      setLat(building.gpsLat != null ? String(building.gpsLat) : "");
      setLng(building.gpsLng != null ? String(building.gpsLng) : "");
    } else {
      setName(currentBuildings.length === 0 ? "Bâtiment principal" : "");
      setAddress("");
      setBuildingType("");
      setLat("");
      setLng("");
    }
  }, [visible, mode, building, currentBuildings]);

  const handleCaptureLocation = async () => {
    const result = await getCurrentLocation();
    if (result) {
      setLat(String(result.latitude));
      setLng(String(result.longitude));
      if (result.address && !address.trim()) {
        setAddress(result.address);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom du bâtiment est obligatoire");
      return;
    }
    const latNum = lat.trim()
      ? Number(lat.trim().replace(",", "."))
      : undefined;
    const lngNum = lng.trim()
      ? Number(lng.trim().replace(",", "."))
      : undefined;

    setIsSaving(true);
    try {
      if (mode === "edit" && building) {
        const payload: UpdateBuildingPayload = {
          name: name.trim(),
          address: address.trim() || null,
          buildingType: buildingType.trim() || null,
          gpsLat: latNum !== undefined && !Number.isNaN(latNum) ? latNum : null,
          gpsLng: lngNum !== undefined && !Number.isNaN(lngNum) ? lngNum : null,
        };
        const updated = await updateBuilding(building.id, payload);
        onSaved(
          currentBuildings.map((b) => (b.id === updated.id ? updated : b)),
        );
      } else {
        const payload: CreateBuildingPayload = {
          name: name.trim(),
          address: address.trim() || undefined,
          buildingType: buildingType.trim() || undefined,
          gpsLat:
            latNum !== undefined && !Number.isNaN(latNum) ? latNum : undefined,
          gpsLng:
            lngNum !== undefined && !Number.isNaN(lngNum) ? lngNum : undefined,
        };
        const created = await createBuilding(missionId, payload);
        onSaved([...currentBuildings, created]);
      }
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible d'enregistrer le bâtiment";
      Alert.alert("Erreur", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!building) return;
    Alert.alert(
      "Supprimer ce bâtiment ?",
      `"${building.name}" ainsi que ses zones seront définitivement supprimés.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteBuilding(building.id);
              onSaved(currentBuildings.filter((b) => b.id !== building.id));
              onClose();
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de supprimer le bâtiment";
              Alert.alert("Erreur", msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 bg-background dark:bg-background-dark">
          <View className="flex-row items-center gap-two px-four pt-safe-area pb-four">
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={24} />
            </Pressable>
            <ThemedText
              type="smallBold"
              className="text-xl flex-1"
              themeColor="accent"
            >
              {mode === "edit" ? "Modifier le bâtiment" : "Nouveau bâtiment"}
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
                Nom du bâtiment *
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Bâtiment principal, Annexe..."
                placeholderTextColor={theme.textSecondary}
                className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                autoCapitalize="sentences"
              />
            </View>

            <View className="mb-three">
              <ThemedText
                type="small"
                themeColor="textSecondary"
                className="mb-one"
              >
                Type de bâtiment
              </ThemedText>
              <TextInput
                value={buildingType}
                onChangeText={setBuildingType}
                placeholder="Villa, immeuble, entrepôt..."
                placeholderTextColor={theme.textSecondary}
                className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                autoCapitalize="sentences"
              />
            </View>

            <View className="mb-three">
              <ThemedText
                type="small"
                themeColor="textSecondary"
                className="mb-one"
              >
                Adresse
              </ThemedText>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Lot II M 12, Antananarivo"
                placeholderTextColor={theme.textSecondary}
                className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                autoCapitalize="sentences"
              />
            </View>

            <View className="mb-four gap-one">
              <ThemedText type="small" themeColor="textSecondary">
                Position GPS (optionnel)
              </ThemedText>
              <Pressable
                onPress={handleCaptureLocation}
                disabled={locationLoading}
                className="flex-row items-center justify-center gap-two rounded-three border border-border dark:border-border-dark py-two px-three"
                style={({ pressed }) => ({
                  opacity: pressed && !locationLoading ? 0.7 : 1,
                })}
              >
                {locationLoading ? (
                  <Ionicons
                    name="hourglass"
                    color={theme.textSecondary}
                    size={16}
                  />
                ) : (
                  <Ionicons
                    name="locate"
                    color={theme.textSecondary}
                    size={16}
                  />
                )}
                <ThemedText type="default" themeColor="textSecondary">
                  {locationLoading
                    ? "Recherche de la position..."
                    : lat && lng
                      ? "Ma position actuelle"
                      : "Capturer ma position GPS"}
                </ThemedText>
              </Pressable>
              {locationError && (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="text-center"
                >
                  {locationError}
                </ThemedText>
              )}
              {lat && lng && (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="text-center"
                >
                  {lat}, {lng}
                </ThemedText>
              )}
            </View>

            <PrimaryButton
              label={
                mode === "edit"
                  ? "Enregistrer les modifications"
                  : "Ajouter le bâtiment"
              }
              onPress={handleSave}
              disabled={isSaving}
              loading={isSaving}
              loadingLabel="Enregistrement..."
            />

            {mode === "edit" && (
              <View className="mt-two">
                <PrimaryButton
                  label="Supprimer ce bâtiment"
                  onPress={handleDelete}
                  loading={isDeleting}
                  loadingLabel="Suppression..."
                />
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
