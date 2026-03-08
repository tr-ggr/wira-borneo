import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTab } from '../types/domain';

interface TabItem {
  id: AppTab;
  label: string;
}

const tabs: TabItem[] = [
  { id: 'map', label: 'Map Forecast' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'llm', label: 'LLM' },
  { id: 'profile', label: 'Profile' },
  { id: 'help', label: 'Help' },
];

interface AppTabsProps {
  activeTab: AppTab;
  onSelect: (tab: AppTab) => void;
}

export const AppTabs = ({ activeTab, onSelect }: AppTabsProps) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
            onPress={() => onSelect(tab.id)}
          >
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  tabButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7B8C9',
    backgroundColor: '#F4F8FB',
  },
  tabButtonActive: {
    backgroundColor: '#0D3B66',
    borderColor: '#0D3B66',
  },
  tabLabel: {
    color: '#0D3B66',
    fontWeight: '600',
    fontSize: 12,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
