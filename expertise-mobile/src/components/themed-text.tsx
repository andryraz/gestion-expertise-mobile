import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'eyebrow';
  themeColor?: ThemeColor;
};

const TYPE_CLASSES: Record<NonNullable<ThemedTextProps['type']>, string> = {
  default: 'text-base leading-6 font-medium',
  title: 'text-[48px] leading-[52px] font-semibold',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  subtitle: 'text-[32px] leading-[44px] font-semibold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-link-primary',
  code: 'text-xs',
  eyebrow: 'text-[11px] leading-[14px] font-bold uppercase tracking-[1.2px]',
};

// Mirrors src/constants/theme.ts Colors.light / Colors.dark keys.
const COLOR_CLASSES: Record<ThemeColor, string> = {
  text: 'text-text dark:text-text-dark',
  background: 'text-background dark:text-background-dark',
  backgroundElement: 'text-background-element dark:text-background-element-dark',
  backgroundSelected: 'text-background-selected dark:text-background-selected-dark',
  textSecondary: 'text-text-secondary dark:text-text-secondary-dark',
  border: 'text-border dark:text-border-dark',
  success: 'text-success dark:text-success-dark',
  danger: 'text-danger dark:text-danger-dark',
};

export function ThemedText({
  className,
  style,
  type = 'default',
  themeColor,
  ...rest
}: ThemedTextProps) {
  // `code` needs a platform-specific font family/weight that Tailwind can't express, so it stays inline.
  const codeStyle =
    type === 'code'
      ? {
          fontFamily: Fonts.mono,
          fontWeight: (Platform.select({ android: 700 }) ?? 500) as TextStyle['fontWeight'],
        }
      : undefined;

  return (
    <Text
      className={[TYPE_CLASSES[type], COLOR_CLASSES[themeColor ?? 'text'], className]
        .filter(Boolean)
        .join(' ')}
      style={[codeStyle, style]}
      {...rest}
    />
  );
}
