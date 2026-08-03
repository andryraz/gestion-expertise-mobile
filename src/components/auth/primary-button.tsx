import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
};

export function PrimaryButton({
  label,
  loadingLabel,
  onPress,
  disabled,
  loading,
  icon,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isActive = !disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isActive ? theme.text : theme.backgroundSelected,
          opacity: pressed && isActive ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={isActive ? theme.background : theme.textSecondary} />
      ) : (
        <>
          <ThemedText
            style={[styles.label, { color: isActive ? theme.background : theme.textSecondary }]}>
            {loading ? loadingLabel ?? label : label}
          </ThemedText>
          {icon && (
            <SymbolView
              tintColor={isActive ? theme.background : theme.textSecondary}
              name={{ ios: icon, web: icon } as any}
              size={16}
              weight="bold"
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.one,
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
