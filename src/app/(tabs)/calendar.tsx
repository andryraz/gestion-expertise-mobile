import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/dashboard";
import { ThemedView } from "@/components/themed-view";

export default function CalendarScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState
          icon="calendar"
          title="Calendrier"
          description="Rendez-vous et visites terrain planifiés s'afficheront ici prochainement."
        />
      </SafeAreaView>
    </ThemedView>
  );
}
