import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Theme } from '../theme';

interface Props {
  value: number;
  size?: number;
  onChange?: (value: number) => void; // when provided, the stars are tappable
}

export function StarRating({ value, size = 16, onChange }: Props) {
  const rounded = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rounded;
        const star = (
          <Star
            size={size}
            color={filled ? Theme.colors.star : '#CBD5E1'}
            fill={filled ? Theme.colors.star : 'transparent'}
          />
        );
        return onChange ? (
          <TouchableOpacity
            key={i}
            onPress={() => onChange(i)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={{ marginRight: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}
          >
            {star}
          </TouchableOpacity>
        ) : (
          <View key={i} style={{ marginRight: 2 }}>
            {star}
          </View>
        );
      })}
    </View>
  );
}

/** Stars + "4.5 (12)" - or a quiet "No reviews yet". */
export function RatingLine({ average, count, size = 14 }: { average: number; count: number; size?: number }) {
  if (!count) return <Text style={styles.none}>No reviews yet</Text>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <StarRating value={average} size={size} />
      <Text style={styles.avg}>{average.toFixed(1)}</Text>
      <Text style={styles.count}>({count})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  none: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  avg: { marginLeft: 6, fontSize: 13, fontWeight: '800', color: '#0F172A' },
  count: { marginLeft: 3, fontSize: 12, color: '#64748B', fontWeight: '600' },
});
