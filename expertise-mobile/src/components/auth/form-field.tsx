import { ReactNode, useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
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
    <View className="gap-one">
      <View className="flex-row items-center justify-between">
        <ThemedText type="eyebrow" themeColor="textSecondary" className="mb-0">
          {label}
        </ThemedText>
        {rightElement}
      </View>
      <View
        className={[
          'flex-row items-center gap-two rounded-three border px-three py-three android:py-two bg-background dark:bg-background-dark',
          borderColor ? '' : 'border-border dark:border-border-dark',
        ].join(' ')}
        style={borderColor ? { borderColor } : undefined}>
        <SymbolView
          tintColor={iconColor ?? theme.textSecondary}
          name={{ ios: icon, web: icon } as any}
          size={16}
        />
        <TextInput
          className="flex-1 p-0 text-base leading-6 text-text dark:text-text-dark"
          style={style}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          {...rest}
        />
        {secureToggle && (
          <Pressable onPress={() => setHidden(!hidden)} className="p-half" hitSlop={8}>
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
          className="text-xs leading-4"
          style={helperColor ? { color: helperColor } : undefined}>
          {helperText}
        </ThemedText>
      )}
    </View>
  );
}
