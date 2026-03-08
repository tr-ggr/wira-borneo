import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ScreenLayout } from '../components/ScreenLayout';
import { useDisasterApi } from '../hooks/useDisasterApi';
import { useAppState } from '../state/AppState';
import { RouteStep, WarningItem } from '../types/domain';

const createShelterRoute = (warning: WarningItem, shelterName: string): RouteStep[] => {
  const caution = warning.kind === 'earthquake' ? 'Avoid damaged roads.' : 'Avoid flooded streets.';

  return [
    { id: `${warning.id}-1`, instruction: 'Head north on the nearest main road', distanceKm: 0.8 },
    { id: `${warning.id}-2`, instruction: caution, distanceKm: 0.6 },
    { id: `${warning.id}-3`, instruction: `Proceed directly to ${shelterName}`, distanceKm: 0.9 },
  ];
};

export const WarningsScreen = () => {
  const { evacuationAreas } = useAppState();
  const { queries } = useDisasterApi();

  const nearestShelter = evacuationAreas[0]?.name ?? 'nearest shelter';
  const warnings = queries.warningItems;

  return (
    <ScreenLayout
      title="Warnings"
      subtitle="When danger is detected, shelter pathways are generated automatically for quick evacuation."
    >
      {warnings.map((warning) => {
        const route = createShelterRoute(warning, nearestShelter);

        return (
          <Card key={warning.id} title={warning.title} subtitle={warning.details}>
            <View style={styles.metaRow}>
              <Badge label={warning.level} level={warning.level} />
              <Text style={styles.metaText}>ETA: {warning.eta}</Text>
            </View>

            <Text style={styles.routeTitle}>Auto Shelter Route</Text>
            {route.map((step, index) => (
              <Text key={step.id} style={styles.stepText}>
                {index + 1}. {step.instruction} ({step.distanceKm.toFixed(1)} km)
              </Text>
            ))}
          </Card>
        );
      })}

      <Card title="Family Impact" subtitle="Potentially affected members based on risk and map overlap">
        <Text style={styles.metaText}>
          {queries.impact.isFetching
            ? 'Analyzing impacts...'
            : 'At least one family member is in a high-risk area. Keep communication open.'}
        </Text>
      </Card>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: '#36516A',
    fontSize: 12,
  },
  routeTitle: {
    color: '#0D3B66',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 6,
  },
  stepText: {
    color: '#36516A',
    fontSize: 12,
    lineHeight: 18,
  },
});
