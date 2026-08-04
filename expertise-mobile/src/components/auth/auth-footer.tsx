import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type AuthFooterProps = {
  line1: string;
  line2?: string;
};

export function AuthFooter({ line1, line2 }: AuthFooterProps) {
  return (
    <View className="mt-five items-center gap-0.5">
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {line1}
      </ThemedText>
      {line2 && (
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {line2}
        </ThemedText>
      )}
    </View>
  );
}
