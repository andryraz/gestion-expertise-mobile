import { SymbolView } from 'expo-symbols';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

type SectionCardProps = {
  icon?: string;
  title: string;
  children: ReactNode;
};

export function SectionCard({ icon, title, children }: SectionCardProps) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" className="gap-three rounded-three p-three">
      <View className="flex-row items-center gap-one">
        {icon && <SymbolView tintColor={theme.text} name={{ ios: icon, web: icon } as any} size={16} />}
        <ThemedText type="eyebrow">{title}</ThemedText>
      </View>
      <View className="gap-two">{children}</View>
    </ThemedView>
  );
}
