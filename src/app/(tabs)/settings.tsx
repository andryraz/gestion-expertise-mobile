import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";

export default function SettingsScreen() {
  const { logout, user } = useAuth();

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, padding: Spacing.four, gap: Spacing.three }}
      >
        <ThemedText type="subtitle">{user?.name}</ThemedText>
        <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
        <View style={{ marginTop: "auto" }}>
          <PrimaryButton label="Se déconnecter" onPress={logout} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
