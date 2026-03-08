import { StyleSheet, Text, View } from 'react-native';

import { RiskLevel } from '../types/domain';

interface BadgeProps {
  label: string;
  level?: RiskLevel;
}

export const Badge = ({ label, level }: BadgeProps) => {
  return (
    <View style={[styles.badge, level ? levelStyles[level] : null]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#D8E3EF',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D3B66',
    textTransform: 'uppercase',
  },
});

const levelStyles = StyleSheet.create({
  low: { backgroundColor: '#D4F4DD' },
  medium: { backgroundColor: '#FDEDB5' },
  high: { backgroundColor: '#FFD6B3' },
  critical: { backgroundColor: '#FFC2C2' },
});
