import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type PendingQuoteRowProps = {
  reference: string;
  title: string;
};

export function PendingQuoteRow({ reference, title }: PendingQuoteRowProps) {
  return (
    <View className="gap-0.5 rounded-two border border-border p-two dark:border-border-dark">
      <ThemedText type="eyebrow" themeColor="textSecondary">
        RÉF: {reference}
      </ThemedText>
      <ThemedText type="smallBold" numberOfLines={2}>
        {title}
      </ThemedText>
    </View>
  );
}
