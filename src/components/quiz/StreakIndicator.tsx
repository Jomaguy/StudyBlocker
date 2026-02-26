import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  streak: number;
  required: number;
}

export default function StreakIndicator({ streak, required }: Props) {
  const dots = Array.from({ length: required }, (_, i) => i < streak);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Progress</Text>
      <View style={styles.dots}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled]}>
            {filled && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        ))}
      </View>
      <Text style={styles.sub}>{streak}/{required} correct in a row</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 12 },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  sub: { color: '#666', fontSize: 12 },
});
