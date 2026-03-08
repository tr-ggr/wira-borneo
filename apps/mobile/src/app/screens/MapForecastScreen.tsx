import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ScreenLayout } from '../components/ScreenLayout';
import { useDisasterApi } from '../hooks/useDisasterApi';
import { useAppState } from '../state/AppState';
import { EvacuationArea } from '../types/domain';

export const MapForecastScreen = () => {
  const { profile, evacuationAreas, addEvacuationArea } = useAppState();
  const { queries } = useDisasterApi();

  const [name, setName] = useState('');
  const [capacityLabel, setCapacityLabel] = useState('80 people');

  const mapMembers = queries.familyMapItems;
  const locationLabel = `${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}`;

  const riskStatus = useMemo(() => {
    if (queries.forecast.isFetching) {
      return 'Updating forecast';
    }

    if (queries.forecast.isError) {
      return 'Forecast fallback in use';
    }

    return 'Forecast synced';
  }, [queries.forecast.isError, queries.forecast.isFetching]);

  const onAddEvacuationArea = () => {
    if (!name.trim()) {
      return;
    }

    const newArea: EvacuationArea = {
      id: `evac-${Date.now()}`,
      name: name.trim(),
      capacityLabel: capacityLabel.trim() || 'Unknown capacity',
      location: {
        latitude: profile.location.latitude,
        longitude: profile.location.longitude,
      },
    };

    addEvacuationArea(newArea);
    setName('');
  };

  return (
    <ScreenLayout
      title="Map Forecast"
      subtitle="Your current location is the map default. Add evacuation points and monitor family visibility."
    >
      <Card title="Current Location" subtitle="Default map center for this account">
        <Badge label={riskStatus} />
        <Text style={styles.detailText}>Coordinates: {locationLabel}</Text>
      </Card>

      <Card title="Family Map" subtitle="Live family positions for incident awareness">
        {mapMembers.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.detailText}>
                {member.location.latitude.toFixed(4)}, {member.location.longitude.toFixed(4)}
              </Text>
            </View>
            <Badge label={member.status === 'safe' ? 'Safe' : 'Needs attention'} />
          </View>
        ))}
      </Card>

      <Card title="Evacuation Areas" subtitle="Save nearby shelters pinned to your current location by default">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Evacuation area name"
          placeholderTextColor="#63809D"
          style={styles.input}
        />
        <TextInput
          value={capacityLabel}
          onChangeText={setCapacityLabel}
          placeholder="Capacity label"
          placeholderTextColor="#63809D"
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={onAddEvacuationArea}>
          <Text style={styles.buttonLabel}>Set Evacuation Area</Text>
        </Pressable>

        {evacuationAreas.map((area) => (
          <View key={area.id} style={styles.areaRow}>
            <Text style={styles.memberName}>{area.name}</Text>
            <Text style={styles.detailText}>{area.capacityLabel}</Text>
          </View>
        ))}
      </Card>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  detailText: {
    color: '#36516A',
    fontSize: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E3ECF5',
    paddingBottom: 8,
    marginBottom: 8,
  },
  memberName: {
    color: '#0D3B66',
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BED0E1',
    borderRadius: 10,
    backgroundColor: '#F7FAFD',
    color: '#0D3B66',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  button: {
    marginTop: 2,
    borderRadius: 10,
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  areaRow: {
    borderTopWidth: 1,
    borderTopColor: '#E3ECF5',
    paddingTop: 8,
  },
});
