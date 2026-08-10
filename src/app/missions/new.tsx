import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissionForm, type MissionFormValues } from '@/components/missions';
import { ScreenFade } from '@/components/screen-fade';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api-client';
import { createMission } from '@/services/mission-services';
import { logger } from '@/utils/logger';

export default function NewMissionScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: MissionFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const mission = await createMission({
        title: values.title,
        missionType: values.missionType,
        buildingAddress: values.buildingAddress,
        buildingType: values.buildingType,
        expertId: user.id,
      });
      logger.info('Missions', 'Mission créée', { id: mission.id });
      router.replace('/missions' as any);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Impossible de créer la mission';
      setError(message);
      logger.error('Missions', 'Échec de la création', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <View className="flex-row items-center gap-two px-four py-two">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" color={theme.text} size={22} />
            </Pressable>
            <ThemedText type="subtitle" themeColor="accent">
              Nouvelle mission
            </ThemedText>
          </View>

          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerClassName="w-full max-w-content self-center px-four pb-six"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <MissionForm
                submitLabel="Créer la mission"
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={handleSubmit}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
