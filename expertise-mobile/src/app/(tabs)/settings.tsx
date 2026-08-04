import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/auth-context";

export default function SettingsScreen() {
  const { logout, user } = useAuth();

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 gap-three p-four">
        <ThemedText type="subtitle">{user?.name}</ThemedText>
        <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
        <View className="mt-auto">
          <PrimaryButton label="Se déconnecter" onPress={logout} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
