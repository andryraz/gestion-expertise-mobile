import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function CheckboxRow({ checked, onToggle, children }: CheckboxRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      style={styles.row}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.text : theme.border,
            backgroundColor: checked ? theme.text : 'transparent',
          },
        ]}>
        {checked && (
          <SymbolView
            tintColor={theme.background}
            name={{ ios: 'checkmark', web: 'checkmark' } as any}
            size={12}
            weight="bold"
          />
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  label: {
    flex: 1,
    lineHeight: 19,
  },
});
