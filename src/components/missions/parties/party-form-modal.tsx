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

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useTheme } from "@/hooks/use-theme";
import {
  useCreateParty,
  useDeleteParty,
  useUpdateParty,
} from "@/queries/parties";
import { ApiError } from "@/services/api-client";
import {
  PARTY_ROLE_LABELS,
  type CreatePartyPayload,
  type Party,
  type PartyRole,
  type UpdatePartyPayload,
} from "@/types/party";

type ModalMode = "create" | "edit";

const ALL_ROLES: PartyRole[] = [
  "CLIENT",
  "REQUERANT",
  "AVOCAT",
  "ENTREPRISE",
  "PROPRIETAIRE",
  "AUTRE",
];

type PartyFormModalProps = {
  visible: boolean;
  mode: ModalMode;
  party: Party | null;
  missionId: string;
  onClose: () => void;
};

export function PartyFormModal({
  visible,
  mode,
  party,
  missionId,
  onClose,
}: PartyFormModalProps) {
  const theme = useTheme();

  const [fullName, setFullName] = useState(party?.fullName ?? "");
  const [role, setRole] = useState<PartyRole>(party?.role ?? "CLIENT");
  const [email, setEmail] = useState(party?.email ?? "");
  const [phone, setPhone] = useState(party?.phone ?? "");

  const createPartyMutation = useCreateParty(missionId);
  const updatePartyMutation = useUpdateParty(missionId);
  const deletePartyMutation = useDeleteParty(missionId);

  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && party) {
      setFullName(party.fullName);
      setRole(party.role);
      setEmail(party.email ?? "");
      setPhone(party.phone ?? "");
    } else {
      setFullName("");
      setRole("CLIENT");
      setEmail("");
      setPhone("");
    }
  }, [visible, mode, party]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Erreur", "Le nom est obligatoire");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Erreur", "Le numéro de téléphone est obligatoire");
      return;
    }
    try {
      if (mode === "edit" && party) {
        const payload: UpdatePartyPayload = {
          fullName: fullName.trim(),
          role,
          phone: phone.trim(),
          email: email.trim() || null,
        };
        await updatePartyMutation.mutateAsync({ partyId: party.id, payload });
      } else {
        const payload: CreatePartyPayload = {
          fullName: fullName.trim(),
          role,
          phone: phone.trim(),
        };
        if (email.trim()) payload.email = email.trim();
        await createPartyMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Impossible d'enregistrer la partie";
      Alert.alert("Erreur", msg);
    }
  };

  const handleDelete = () => {
    if (!party) return;
    Alert.alert(
      "Supprimer cette partie ?",
      `"${party.fullName}" sera définitivement retirée de la mission.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePartyMutation.mutateAsync(party.id);
              onClose();
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.message
                  : "Impossible de supprimer la partie";
              Alert.alert("Erreur", msg);
            }
          },
        },
      ],
    );
  };

  const isSaving =
    createPartyMutation.isPending || updatePartyMutation.isPending;
  const isDeleting = deletePartyMutation.isPending;

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
              {mode === "edit" ? "Modifier la partie" : "Nouvelle partie"}
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
                Téléphone *
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

            <View className="mb-four">
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

            <PrimaryButton
              label={
                mode === "edit"
                  ? "Enregistrer les modifications"
                  : "Ajouter la partie"
              }
              onPress={handleSave}
              disabled={isSaving}
              loading={isSaving}
              loadingLabel="Enregistrement..."
            />

            {mode === "edit" && (
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
  );
}
