import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ChipOption<T extends string> = { value: T; label: string };

type ChipSelectProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ChipSelect<T extends string>({ options, value, onChange }: ChipSelectProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-two">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={[
              'rounded-five border px-three py-two',
              isActive
                ? 'border-accent bg-accent'
                : 'border-border bg-background-element dark:border-border-dark dark:bg-background-element-dark',
            ].join(' ')}>
            <ThemedText type="smallBold" themeColor={isActive ? 'background' : 'textSecondary'} numberOfLines={1}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
