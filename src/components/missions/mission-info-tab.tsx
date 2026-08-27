import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { FormField } from "@/components/auth/form-field";
import { PrimaryButton } from "@/components/auth/primary-button";
import { MissionBuildingsSection } from "@/components/missions/mission-buildings-section";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import type { Building } from "@/types/building";
import type { Mission, UpdateMissionPayload } from "@/types/mission";

type MissionInfoTabProps = {
  mission: Mission;
  isArchived: boolean;
  onUpdate?: (payload: UpdateMissionPayload) => Promise<void>;
  onBuildingsChange?: (buildings: Building[]) => void;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  const theme = useTheme();
  return (
    <View className="flex-row items-start gap-two py-two">
      <Ionicons
        name={icon}
        color={theme.textSecondary}
        size={16}
        style={{ marginTop: 2 }}
      />
      <View className="flex-1">
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="default" className="mt-half">
          {value || "—"}
        </ThemedText>
      </View>
    </View>
  );
}

export function MissionInfoTab({
  mission,
  isArchived,
  onUpdate,
  onBuildingsChange,
}: MissionInfoTabProps) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [legalContext, setLegalContext] = useState(mission.legalContext ?? "");

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({ legalContext: legalContext.trim() || undefined });
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLegalContext(mission.legalContext ?? "");
    setEditing(false);
  };

  return (
    <View className="gap-six">
      <MissionBuildingsSection
        missionId={mission.id}
        buildings={mission.buildings ?? []}
        isArchived={isArchived}
        onChange={onBuildingsChange}
      />

      <View>
        <View className="flex-row items-center justify-between mb-two">
          <ThemedText type="eyebrow" themeColor="accent">
            Contexte juridique
          </ThemedText>
          {!isArchived && onUpdate && !editing && (
            <Pressable
              onPress={() => setEditing(true)}
              hitSlop={8}
              className="flex-row items-center gap-one"
            >
              <Ionicons name="pencil" color={theme.accent} size={14} />
              <ThemedText type="small" themeColor="accent">
                Modifier
              </ThemedText>
            </Pressable>
          )}
        </View>

        {editing ? (
          <View className="gap-three">
            <FormField
              label="Contexte juridique"
              icon="document-lock-outline"
              placeholder="Mission ordonnée par le tribunal..."
              value={legalContext}
              onChangeText={setLegalContext}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-two">
              <View className="flex-1">
                <PrimaryButton label="Annuler" onPress={handleCancel} />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  label="Enregistrer"
                  onPress={handleSave}
                  loading={isSaving}
                  loadingLabel="Enregistrement..."
                />
              </View>
            </View>
          </View>
        ) : (
          <ThemedView
            type="backgroundElement"
            className="rounded-three border border-border dark:border-border-dark px-three"
          >
            <InfoRow
              icon="document-lock-outline"
              label="Contexte juridique"
              value={mission.legalContext}
            />
          </ThemedView>
        )}
      </View>
    </View>
  );
}
