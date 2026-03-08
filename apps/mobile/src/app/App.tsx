import { useMemo, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

import { AppTabs } from './components/AppTabs';
import { ApiBootstrap } from './providers/ApiBootstrap';
import { QueryProvider } from './providers/QueryProvider';
import { HelpScreen } from './screens/HelpScreen';
import { LlmScreen } from './screens/LlmScreen';
import { MapForecastScreen } from './screens/MapForecastScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { WarningsScreen } from './screens/WarningsScreen';
import { AppStateProvider } from './state/AppState';
import { AppTab } from './types/domain';

const ScreenSwitcher = ({ activeTab }: { activeTab: AppTab }) => {
  if (activeTab === 'map') {
    return <MapForecastScreen />;
  }

  if (activeTab === 'warnings') {
    return <WarningsScreen />;
  }

  if (activeTab === 'llm') {
    return <LlmScreen />;
  }

  if (activeTab === 'profile') {
    return <ProfileScreen />;
  }

  return <HelpScreen />;
};

const AppContainer = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('map');

  const tabSubtitle = useMemo(() => {
    switch (activeTab) {
      case 'map':
        return 'Forecast + family visibility';
      case 'warnings':
        return 'Impact alerts + automatic routes';
      case 'llm':
        return 'General disaster inquiries';
      case 'profile':
        return 'Identity, family code, volunteer role';
      default:
        return 'Request and volunteer response';
    }
  }, [activeTab]);

  return (
    <View style={styles.shell}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAF2F9" />
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Wira Borneo Response</Text>
        <Text style={styles.appSubtitle}>{tabSubtitle}</Text>
        <AppTabs activeTab={activeTab} onSelect={setActiveTab} />
      </View>
      <View style={styles.content}>
        <ScreenSwitcher activeTab={activeTab} />
      </View>
    </View>
  );
};

export const App = () => {
  return (
    <QueryProvider>
      <ApiBootstrap>
        <AppStateProvider>
          <AppContainer />
        </AppStateProvider>
      </ApiBootstrap>
    </QueryProvider>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#EAF2F9',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#CFDCE8',
    backgroundColor: '#EAF2F9',
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0D3B66',
  },
  appSubtitle: {
    marginTop: 2,
    color: '#4A667F',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
});

export default App;
