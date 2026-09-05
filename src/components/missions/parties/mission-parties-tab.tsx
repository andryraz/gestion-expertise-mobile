import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useMissionParties } from "@/queries/parties";
import { ApiError } from "@/services/api-client";
import type { Party } from "@/types/party";

import { PartyCard } from "./party-card";
import { PartyFormModal } from "./party-form-modal";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const {
    data: parties = [],
    isLoading,
    error: queryError,
  } = useMissionParties(missionId);

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Impossible de charger les parties"
    : null;

  const openCreateModal = () => {
    setModalMode("create");
    setEditingParty(null);
    setModalVisible(true);
  };

  const openEditModal = (party: Party) => {
    setModalMode("edit");
    setEditingParty(party);
    setModalVisible(true);
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
              <PartyCard
                key={party.id}
                party={party}
                isArchived={isArchived}
                onPress={() => openEditModal(party)}
              />
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

      <PartyFormModal
        visible={modalVisible}
        mode={modalMode}
        party={editingParty}
        missionId={missionId}
        onClose={() => {
          setModalVisible(false);
          setEditingParty(null);
        }}
      />
    </>
  );
}
