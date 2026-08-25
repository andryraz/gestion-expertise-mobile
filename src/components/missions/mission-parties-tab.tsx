import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
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
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import {
  createParty,
  deleteParty,
  getMissionParties,
  updateParty,
} from "@/services/party-services";
import {
  PARTY_ROLE_LABELS,
  type CreatePartyPayload,
  type Party,
  type PartyRole,
  type UpdatePartyPayload,
} from "@/types/party";

const ROLE_BADGE_CLASSES: Record<PartyRole, string> = {
  CLIENT: "bg-accent",
  REQUERANT: "bg-accent",
  AVOCAT: "bg-accent",
  ENTREPRISE: "bg-background-selected dark:bg-background-selected-dark",
  PROPRIETAIRE: "bg-success dark:bg-success-dark",
  AUTRE: "bg-background-selected dark:bg-background-selected-dark",
};

const ROLE_BADGE_TEXT: Record<PartyRole, string> = {
  CLIENT: "background",
  REQUERANT: "background",
  AVOCAT: "background",
  ENTREPRISE: "textSecondary",
  PROPRIETAIRE: "background",
  AUTRE: "textSecondary",
};

const ALL_ROLES: PartyRole[] = [
  "CLIENT",
  "REQUERANT",
  "AVOCAT",
  "ENTREPRISE",
  "PROPRIETAIRE",
  "AUTRE",
];

type MissionPartiesTabProps = {
  missionId: string;
  isArchived: boolean;
};

type ModalMode = "create" | "edit";

export function MissionPartiesTab({
  missionId,
  isArchived,
}: MissionPartiesTabProps) {
  const theme = useTheme();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<PartyRole>("CLIENT");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadParties = useCallback(async () => {
    setError(null);
    try {
      const result = await getMissionParties(missionId);
      setParties(result);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible de charger les parties";
      setError(msg);
    }
  }, [missionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        await loadParties();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadParties]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingParty(null);
    setFullName("");
    setRole("CLIENT");
    setEmail("");
    setPhone("");
    setModalVisible(true);
  };

  const openEditModal = (party: Party) => {
    setModalMode("edit");
    setEditingParty(party);
    setFullName(party.fullName);
    setRole(party.role);
    setEmail(party.email ?? "");
    setPhone(party.phone ?? "");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingParty(null);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Erreur", "Le nom est obligatoire");
      return;
    }
    setIsSaving(true);
    try {
      if (modalMode === "edit" && editingParty) {
        const payload: UpdatePartyPayload = {
          fullName: fullName.trim(),
          role,
        };
        if (email.trim()) payload.email = email.trim();
        if (phone.trim()) payload.phone = phone.trim();
        const updated = await updateParty(editingParty.id, payload);
        setParties((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
      } else {
        const payload: CreatePartyPayload = {
          fullName: fullName.trim(),
          role,
        };
        if (email.trim()) payload.email = email.trim();
        if (phone.trim()) payload.phone = phone.trim();
        const created = await createParty(missionId, payload);
        setParties((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible d'enregistrer la partie";
      Alert.alert("Erreur", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingParty) return;
    Alert.alert(
      "Supprimer cette partie ?",
      `"${editingParty.fullName}" sera définitivement retirée de la mission.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteParty(editingParty.id);
              setParties((prev) =>
                prev.filter((p) => p.id !== editingParty.id),
              );
              closeModal();
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de supprimer la partie";
              Alert.alert("Erreur", msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedText themeColor="textSecondary" className="text-center py-four">
        Chargement...
      </ThemedText>
    );
  }

  if (error) {
    return (
      <ThemedText themeColor="danger" className="text-center py-four">
        {error}
      </ThemedText>
    );
  }

  return (
    <>
      {parties.length === 0 ? (
        <View className="items-center py-six">
          <Ionicons
            name="people-outline"
            color={theme.textSecondary}
            size={32}
          />
          <ThemedText themeColor="textSecondary" className="mt-two text-center">
            Aucune partie liée à cette mission
          </ThemedText>
          {!isArchived && (
            <Pressable
              onPress={openCreateModal}
              className="mt-three flex-row items-center gap-one rounded-three bg-accent px-four py-two"
            >
              <Ionicons name="add" color={theme.background} size={16} />
              <ThemedText type="smallBold" themeColor="background">
                + Ajouter une partie
              </ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-two">
            {parties.map((party) => (
              <Pressable
                key={party.id}
                onPress={() => !isArchived && openEditModal(party)}
                disabled={isArchived}
              >
                <ThemedView
                  type="backgroundElement"
                  className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
                    <ThemedText type="smallBold" themeColor="accent">
                      {party.fullName
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </ThemedText>
                  </View>

                  <View className="flex-1">
                    <ThemedText type="smallBold">{party.fullName}</ThemedText>
                    {party.email && (
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={1}
                      >
                        {party.email}
                      </ThemedText>
                    )}
                  </View>

                  <View
                    className={[
                      "rounded-five border border-transparent px-two py-half",
                      ROLE_BADGE_CLASSES[party.role],
                    ].join(" ")}
                  >
                    <ThemedText
                      type="eyebrow"
                      themeColor={ROLE_BADGE_TEXT[party.role] as any}
                    >
                      {PARTY_ROLE_LABELS[party.role]}
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            ))}
          </View>

          {!isArchived && (
            <Pressable
              onPress={openCreateModal}
              className="mt-three flex-row items-center justify-center gap-one rounded-three bg-accent py-two"
            >
              <Ionicons name="add" color={theme.background} size={16} />
              <ThemedText type="smallBold" themeColor="background">
                + Ajouter une partie
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
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
                  ? "Modifier la partie"
                  : "Nouvelle partie"}
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
                  Nom complet *
                </ThemedText>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Jean Dupont"
                  placeholderTextColor={theme.textSecondary}
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-two"
                >
                  Rôle *
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex-row gap-two"
                >
                  {ALL_ROLES.map((r) => {
                    const isActive = r === role;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        className={[
                          "rounded-five border px-three py-two",
                          isActive
                            ? "border-accent bg-accent"
                            : "border-border bg-background-element dark:border-border-dark dark:bg-background-element-dark",
                        ].join(" ")}
                      >
                        <ThemedText
                          type="smallBold"
                          themeColor={isActive ? "background" : "textSecondary"}
                          numberOfLines={1}
                        >
                          {PARTY_ROLE_LABELS[r]}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View className="mb-three">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Email
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jean@email.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                />
              </View>

              <View className="mb-four">
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  className="mb-one"
                >
                  Téléphone
                </ThemedText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+261 34 12 345 67"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium"
                />
              </View>

              <PrimaryButton
                label={
                  modalMode === "edit"
                    ? "Enregistrer les modifications"
                    : "Ajouter la partie"
                }
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
                loadingLabel="Enregistrement..."
              />

              {modalMode === "edit" && (
                <View className="mt-two">
                  <PrimaryButton
                    label="Supprimer cette partie"
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
    </>
  );
}
