import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type StatTileProps = {
  label: string;
  value: number;
  valueColor?: string;
};

export function StatTile({ label, value, valueColor }: StatTileProps) {
  return (
    <View className="grow basis-[48%] gap-one rounded-three border border-border p-three dark:border-border-dark">
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText
        className="text-[32px] leading-[38px] font-extrabold"
        style={valueColor ? { color: valueColor } : undefined}>
        {String(value).padStart(2, '0')}
      </ThemedText>
    </View>
  );
}
