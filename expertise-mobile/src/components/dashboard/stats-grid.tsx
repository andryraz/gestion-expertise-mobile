import { ReactNode } from 'react';
import { View } from 'react-native';

export function StatsGrid({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-two">{children}</View>;
}
