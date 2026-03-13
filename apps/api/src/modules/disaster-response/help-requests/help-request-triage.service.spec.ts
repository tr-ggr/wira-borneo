import { parseHelpRequestTriageResult } from './help-request-triage.service';

describe('parseHelpRequestTriageResult', () => {
  it('parses direct payload objects', () => {
    const parsed = parseHelpRequestTriageResult({
      predicted_urgency: 'critical',
      urgency_confidence: '0.93',
    });

    expect(parsed).toEqual({
      predictedUrgency: 'CRITICAL',
      urgencyConfidence: 0.93,
    });
  });

  it('parses nested array/object payloads', () => {
    const parsed = parseHelpRequestTriageResult({
      data: [
        { other: true },
        {
          result: {
            predicted_urgency: 'HIGH',
            urgency_confidence: 0.9,
          },
        },
      ],
    });

    expect(parsed).toEqual({
      predictedUrgency: 'HIGH',
      urgencyConfidence: 0.9,
    });
  });

  it('returns null when required schema fields are invalid', () => {
    const parsed = parseHelpRequestTriageResult({
      predicted_urgency: 'UNKNOWN',
      urgency_confidence: 'not-a-number',
    });

    expect(parsed).toBeNull();
  });

  it('parses JSON strings within arrays (reported case)', () => {
    const reportedPayload = {
      type: 'data',
      data: [
        { label: 'infrastructure_damage' },
        { label: 'infrastructure_damage' },
        JSON.stringify({
          summary: 'Hazard Type: FLOOD\nDescription: ...',
          predicted_urgency: 'infrastructure_damage',
          urgency_confidence: 0.7705686092376709,
          predicted_incident_types: [],
        }),
      ],
    };

    const parsed = parseHelpRequestTriageResult(reportedPayload);

    expect(parsed).toEqual({
      predictedUrgency: 'MEDIUM',
      urgencyConfidence: 0.7705686092376709,
    });
  });
});
