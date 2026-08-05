import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/dashboard";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedView } from "@/components/themed-view";

export default function MissionsScreen() {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <EmptyState
            icon="doc.text.fill"
            title="Liste des missions"
            description="Le suivi détaillé de toutes tes missions arrive bientôt ici."
          />
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
