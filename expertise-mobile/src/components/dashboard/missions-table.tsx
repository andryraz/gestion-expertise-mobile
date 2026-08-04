import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Mission } from '@/types/mission';

type MissionsTableProps = {
  missions: Mission[];
  onPressMission: (mission: Mission) => void;
};

export function MissionsTable({ missions, onPressMission }: MissionsTableProps) {
  if (missions.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" type="small">
        Aucune mission active pour le moment.
      </ThemedText>
    );
  }

  return (
    <View>
      {missions.map((mission, index) => (
        <Pressable
          key={mission.id}
          onPress={() => onPressMission(mission)}
          className={[
            'gap-1 border-b border-border py-two dark:border-border-dark',
            index === missions.length - 1 ? 'border-b-0' : '',
          ].join(' ')}
          style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <View className="flex-row items-center justify-between gap-two">
            <ThemedText type="smallBold" className="flex-1" numberOfLines={1}>
              {mission.title}
            </ThemedText>
            <ThemedText type="eyebrow" themeColor="textSecondary">
              #{mission.reference}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {mission.buildingAddress ?? 'Lieu non renseigné'}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}
