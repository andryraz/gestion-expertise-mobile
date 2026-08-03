import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type AuthFooterProps = {
  line1: string;
  line2?: string;
};

export function AuthFooter({ line1, line2 }: AuthFooterProps) {
  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
    marginTop: Spacing.five,
  },
});
