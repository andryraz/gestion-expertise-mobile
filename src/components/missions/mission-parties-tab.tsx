import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";
import { getMissionParties } from "@/services/party-services";
import { PARTY_ROLE_LABELS, type Party, type PartyRole } from "@/types/party";

const ROLE_BADGE_CLASSES: Record<PartyRole, string> = {
  CLIENT: "bg-accent",
  AVOCAT: "bg-accent",
  ENTREPRISE: "bg-background-selected dark:bg-background-selected-dark",
  EXPERT: "bg-success dark:bg-success-dark",
  AUTRE: "bg-background-selected dark:bg-background-selected-dark",
};

const ROLE_BADGE_TEXT: Record<PartyRole, string> = {
  CLIENT: "background",
  AVOCAT: "background",
  ENTREPRISE: "textSecondary",
  EXPERT: "background",
  AUTRE: "textSecondary",
};

type MissionPartiesTabProps = {
  missionId: string;
  isArchived: boolean;
};

export function MissionPartiesTab({
  missionId,
  isArchived,
}: MissionPartiesTabProps) {
  const theme = useTheme();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getMissionParties(missionId);
        if (!cancelled) setParties(result);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Impossible de charger les parties";
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missionId]);

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

  if (parties.length === 0) {
    return (
      <View className="items-center py-six">
        <Ionicons
          name="people-outline"
          color={theme.textSecondary}
          size={32}
        />
        <ThemedText themeColor="textSecondary" className="mt-two text-center">
          Aucune partie liée à cette mission
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="gap-two">
      {parties.map((party) => (
        <ThemedView
          key={party.id}
          type="backgroundElement"
          className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
        >
          {/* Avatar placeholder */}
          <View
            className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark"
          >
            <ThemedText type="smallBold" themeColor="accent">
              {party.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </ThemedText>
          </View>

          <View className="flex-1">
            <ThemedText type="smallBold">{party.name}</ThemedText>
            {party.email && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
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
      ))}
    </View>
  );
}
