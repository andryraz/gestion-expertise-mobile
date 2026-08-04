import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  badge?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  badge = 'Bientôt disponible',
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View className="flex-1 items-center justify-center gap-two px-five">
      <View className="mb-one h-16 w-16 items-center justify-center rounded-four bg-background-element dark:bg-background-element-dark">
        <SymbolView tintColor={theme.textSecondary} name={{ ios: icon, web: icon } as any} size={28} />
      </View>
      <ThemedText type="subtitle" className="text-center">
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" className="text-center leading-5">
        {description}
      </ThemedText>
      <View className="mt-two rounded-five bg-background-element px-three py-one dark:bg-background-element-dark">
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {badge}
        </ThemedText>
      </View>
    </View>
  );
}
