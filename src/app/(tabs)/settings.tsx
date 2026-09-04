import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useAuthStore } from "@/store/auth-store";

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 p-four">
        <ScreenFade className="gap-three">
          <ThemedText type="subtitle">{user?.name}</ThemedText>
          <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
          <View className="mt-auto">
            <PrimaryButton label="Se déconnecter" onPress={logout} />
          </View>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
