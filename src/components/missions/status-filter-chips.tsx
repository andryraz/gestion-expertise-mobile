import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { STATUS_LABELS } from '@/constants/mission-labels';
import { MissionStatus } from '@/types/mission';

export type StatusFilterValue = MissionStatus | 'ALL';

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  ...(Object.keys(STATUS_LABELS) as MissionStatus[]).map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  })),
];

type StatusFilterChipsProps = {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
};

export function StatusFilterChips({ value, onChange }: StatusFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-two px-four">
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={[
              'rounded-five border px-three py-one',
              isActive
                ? 'border-accent bg-accent'
                : 'border-border bg-background-element dark:border-border-dark dark:bg-background-element-dark',
            ].join(' ')}>
            <ThemedText
              type="smallBold"
              themeColor={isActive ? 'background' : 'textSecondary'}
              numberOfLines={1}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
