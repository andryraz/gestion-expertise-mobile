import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type StatChipProps = {
  label: string;
  value: string;
  accentColor?: string;
};

export function StatChip({ label, value, accentColor }: StatChipProps) {
  return (
    <View className="flex-1 flex-row gap-two overflow-hidden rounded-two bg-background-element p-two dark:bg-background-element-dark">
      <View
        className={['w-[3px] rounded-[2px]', accentColor ? '' : 'bg-text dark:bg-text-dark'].join(' ')}
        style={accentColor ? { backgroundColor: accentColor } : undefined}
      />
      <View className="flex-1 gap-0.5">
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}
