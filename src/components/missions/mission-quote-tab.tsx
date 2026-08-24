import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import type { Mission } from "@/types/mission";

type MissionDevisTabProps = {
  mission: Mission;
  isArchived: boolean;
};

export function MissionDevisTab({
  mission,
  isArchived,
}: MissionDevisTabProps) {
  const theme = useTheme();

  // For now, show a placeholder since the API doesn't expose devis data yet.
  // The design expects: current amount + history link.
  const hasDevis =
    mission.status !== "BROUILLON" &&
    mission.status !== "PRISE_DE_CONTACT";

  return (
    <View>
      {hasDevis ? (
        <ThemedView
          type="backgroundElement"
          className="rounded-three border border-border dark:border-border-dark p-three"
        >
          <View className="flex-row items-center gap-two mb-two">
            <Ionicons name="document-text" color={theme.accent} size={16} />
            <ThemedText type="eyebrow" themeColor="accent">
              Devis actuel
            </ThemedText>
          </View>

          <View className="items-center py-four">
            <ThemedText
              type="subtitle"
              themeColor="accent"
              className="text-[36px] leading-[40px]"
            >
              —
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" className="mt-one">
              Montant du devis en attente de synchronisation
            </ThemedText>
          </View>
        </ThemedView>
      ) : (
        <View className="items-center py-six">
          <Ionicons
            name="document-outline"
            color={theme.textSecondary}
            size={32}
          />
          <ThemedText themeColor="textSecondary" className="mt-two text-center">
            Aucun devis pour le moment
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            className="mt-one text-center"
          >
            Le devis sera disponible à partir du statut "Devis en préparation"
          </ThemedText>
        </View>
      )}

      {hasDevis && (
        <Pressable
          className="mt-three flex-row items-center justify-center gap-one rounded-three border border-border dark:border-border-dark py-two"
          hitSlop={8}
        >
          <ThemedText type="small" themeColor="accent">
            Voir l'historique
          </ThemedText>
          <Ionicons name="chevron-forward" color={theme.accent} size={14} />
        </Pressable>
      )}
    </View>
  );
}
