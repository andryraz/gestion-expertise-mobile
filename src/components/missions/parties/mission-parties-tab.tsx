import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissionParties } from "@/services/party-services";
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
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingParty, setEditingParty] = useState<Party | null>(null);

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
    setModalVisible(true);
  };

  const openEditModal = (party: Party) => {
    setModalMode("edit");
    setEditingParty(party);
    setModalVisible(true);
  };

  const handleSaved = (next: Party[]) => {
    setParties(next);
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
        currentParties={parties}
        onClose={() => {
          setModalVisible(false);
          setEditingParty(null);
        }}
        onSaved={handleSaved}
      />
    </>
  );
}
