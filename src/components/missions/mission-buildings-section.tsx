import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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

import { PrimaryButton } from "@/components/auth/primary-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

type MissionBuildingsSectionProps = {
  missionId: string;
  buildings: Building[];
  isArchived: boolean;
  onChange?: (buildings: Building[]) => void;
};

type ModalMode = "create" | "edit";

export function MissionBuildingsSection({
  missionId,
  buildings: buildingsProp,
  isArchived,
  onChange,
}: MissionBuildingsSectionProps) {
  const theme = useTheme();
  const {
    getCurrentLocation,
    loading: locationLoading,
    error: locationError,
  } = useCurrentLocation();

  const [buildings, setBuildings] = useState<Building[]>(buildingsProp);

  useEffect(() => {
    setBuildings(buildingsProp);
  }, [buildingsProp]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const applyChange = (next: Building[]) => {
    setBuildings(next);
    onChange?.(next);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBuilding(null);
    setName(buildings.length === 0 ? "Bâtiment principal" : "");
    setAddress("");
    setBuildingType("");
    setLat("");
    setLng("");
    setModalVisible(true);
  };

  const openEditModal = (building: Building) => {
    setModalMode("edit");
    setEditingBuilding(building);
    setName(building.name);
    setAddress(building.address ?? "");
    setBuildingType(building.buildingType ?? "");
    setLat(building.gpsLat != null ? String(building.gpsLat) : "");
    setLng(building.gpsLng != null ? String(building.gpsLng) : "");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingBuilding(null);
  };

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
      if (modalMode === "edit" && editingBuilding) {
        const payload: UpdateBuildingPayload = {
          name: name.trim(),
          address: address.trim() || null,
          buildingType: buildingType.trim() || null,
          gpsLat: latNum !== undefined && !Number.isNaN(latNum) ? latNum : null,
          gpsLng: lngNum !== undefined && !Number.isNaN(lngNum) ? lngNum : null,
        };
        const updated = await updateBuilding(editingBuilding.id, payload);
        applyChange(buildings.map((b) => (b.id === updated.id ? updated : b)));
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
        applyChange([...buildings, created]);
      }
      closeModal();
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
    if (!editingBuilding) return;
    Alert.alert(
      "Supprimer ce bâtiment ?",
      `"${editingBuilding.name}" ainsi que ses zones et observations seront définitivement supprimés.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteBuilding(editingBuilding.id);
              applyChange(buildings.filter((b) => b.id !== editingBuilding.id));
              closeModal();
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
            <Pressable
              key={building.id}
              onPress={() => !isArchived && openEditModal(building)}
              disabled={isArchived}
            >
              <ThemedView
                type="backgroundElement"
                className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
                  <Ionicons name="business" color={theme.accent} size={18} />
                </View>

                <View className="flex-1">
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {building.name}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    numberOfLines={1}
                  >
                    {building.address || "Adresse non renseignée"}
                  </ThemedText>
                </View>

                {building.gpsLat != null && building.gpsLng != null && (
                  <Ionicons
                    name="navigate-outline"
                    color={theme.textSecondary}
                    size={16}
                  />
                )}
                {!isArchived && (
                  <Ionicons
                    name="chevron-forward"
                    color={theme.textSecondary}
                    size={16}
                  />
                )}
              </ThemedView>
            </Pressable>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 bg-background dark:bg-background-dark">
            <View className="flex-row items-center gap-two px-four pt-safe-area pb-four">
              <Pressable onPress={closeModal} hitSlop={8}>
                <Ionicons name="chevron-back" color={theme.text} size={24} />
              </Pressable>
              <ThemedText
                type="smallBold"
                className="text-xl flex-1"
                themeColor="accent"
              >
                {modalMode === "edit"
                  ? "Modifier le bâtiment"
                  : "Nouveau bâtiment"}
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
                  modalMode === "edit"
                    ? "Enregistrer les modifications"
                    : "Ajouter le bâtiment"
                }
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
                loadingLabel="Enregistrement..."
              />

              {modalMode === "edit" && (
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
    </View>
  );
}
