import { ReactNode, useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormFieldProps = TextInputProps & {
  label: string;
  icon: string;
  rightElement?: ReactNode;
  secureToggle?: boolean;
  borderColor?: string;
  iconColor?: string;
  helperText?: string;
  helperColor?: string;
};

export function FormField({
  label,
  icon,
  rightElement,
  secureToggle = false,
  borderColor,
  iconColor,
  helperText,
  helperColor,
  secureTextEntry,
  style,
  ...rest
}: FormFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(secureToggle);

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
        {rightElement}
      </View>
      <View
        style={[
          styles.wrapper,
          {
            borderColor: borderColor ?? theme.border,
            backgroundColor: theme.background,
          },
        ]}>
        <SymbolView
          tintColor={iconColor ?? theme.textSecondary}
          name={{ ios: icon, web: icon } as any}
          size={16}
        />
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          {...rest}
        />
        {secureToggle && (
          <Pressable onPress={() => setHidden(!hidden)} style={styles.eyeButton} hitSlop={8}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={{
                ios: hidden ? 'eye.fill' : 'eye.slash.fill',
                web: hidden ? 'eye.fill' : 'eye.slash.fill',
              } as any}
              size={16}
            />
          </Pressable>
        )}
      </View>
      {helperText && (
        <ThemedText
          type="small"
          style={[styles.helper, helperColor ? { color: helperColor } : undefined]}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    marginBottom: 0,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.three : Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  eyeButton: {
    padding: Spacing.half,
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
});
