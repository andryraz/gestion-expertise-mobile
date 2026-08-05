import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/dashboard";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedView } from "@/components/themed-view";

export default function CalendarScreen() {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <EmptyState
            icon="calendar"
            title="Calendrier"
            description="Rendez-vous et visites terrain planifiés s'afficheront ici prochainement."
          />
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
