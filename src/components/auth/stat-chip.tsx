import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatChipProps = {
  label: string;
  value: string;
  accentColor?: string;
};

export function StatChip({ label, value, accentColor }: StatChipProps) {
  const theme = useTheme();

  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.accent, { backgroundColor: accentColor ?? theme.text }]} />
      <View style={styles.textGroup}>
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

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  accent: {
    width: 3,
    borderRadius: 2,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
});
