import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

interface ScreenLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export const ScreenLayout = ({ title, subtitle, children }: ScreenLayoutProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAF2F9',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D3B66',
  },
  subtitle: {
    marginTop: 4,
    color: '#4A667F',
    fontSize: 13,
    lineHeight: 18,
  },
});
