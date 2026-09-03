import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import {
  PARTY_ROLE_LABELS,
  type Party,
  type PartyRole,
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

import { Linking } from "react-native";

type PartyCardProps = {
  party: Party;
  isArchived: boolean;
  onPress: () => void;
};

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const handleCall = async (phoneNumber: string) => {
  const url = `tel:${phoneNumber.replace(/\s+/g, "")}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Impossible d'appeler",
      "Aucune application d'appel disponible sur cet appareil.",
    );
  }
};

export function PartyCard({ party, isArchived, onPress }: PartyCardProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      className="flex-row items-center gap-three rounded-three border border-border dark:border-border-dark px-three py-three"
    >
      <Pressable
        onPress={onPress}
        disabled={isArchived}
        className="flex-1 flex-row items-center gap-three"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-background-selected dark:bg-background-selected-dark">
          <ThemedText type="smallBold" themeColor="accent">
            {getInitials(party.fullName)}
          </ThemedText>
        </View>

        <View className="flex-1">
          <ThemedText type="smallBold">{party.fullName}</ThemedText>
          {(party.phone || party.email) && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
            >
              {party.phone || party.email}
            </ThemedText>
          )}
        </View>
      </Pressable>

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

      {party.phone && (
        <Pressable
          onPress={() => handleCall(party.phone!)}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full bg-success dark:bg-success-dark"
        >
          <Ionicons name="call" color={theme.background} size={16} />
        </Pressable>
      )}
    </ThemedView>
  );
}
