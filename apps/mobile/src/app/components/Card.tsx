import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export const Card = ({ title, subtitle, children }: CardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6E1EC',
    padding: 14,
    marginBottom: 12,
  },
  title: {
    color: '#0D3B66',
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    marginTop: 4,
    color: '#4A667F',
    fontSize: 12,
  },
  content: {
    marginTop: 10,
    gap: 8,
  },
});
