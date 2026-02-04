// PresetButtons.tsx
import React from 'react';
import { Button, View } from 'react-native';
import { spacing } from '../theme';

type Preset = 'fast' | 'balanced' | 'conservative';

type Props = {
  onSelect: (preset: Preset) => void;
};

export default function PresetButtons({ onSelect }: Props) {
  return (
    <View style={{ flexDirection: 'row', marginVertical: spacing.sm }}>
      <Button title="Fast" onPress={() => onSelect('fast')} />
      <Button title="Balanced" onPress={() => onSelect('balanced')} />
      <Button title="Conservative" onPress={() => onSelect('conservative')} />
    </View>
  );
}
