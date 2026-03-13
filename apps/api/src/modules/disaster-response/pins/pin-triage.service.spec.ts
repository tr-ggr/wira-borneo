import { parsePinTriageResult } from './pin-triage.service';

describe('parsePinTriageResult', () => {
  it('parses direct payload objects', () => {
    const parsed = parsePinTriageResult({
      predicted_urgency: 'critical',
      urgency_confidence: '0.93',
      summary: 'Severe flooding expected in low-lying areas.',
    });

    expect(parsed).toEqual({
      predictedUrgency: 'CRITICAL',
      urgencyConfidence: 0.93,
      summary: 'Severe flooding expected in low-lying areas.',
    });
  });

  it('parses nested array/object payloads', () => {
    const parsed = parsePinTriageResult({
      data: [
        { other: true },
        {
          result: {
            predicted_urgency: 'HIGH',
            urgency_confidence: 0.9,
            summary: 'Heavy rainfall with potential flash flood.',
          },
        },
      ],
    });

    expect(parsed).toEqual({
      predictedUrgency: 'HIGH',
      urgencyConfidence: 0.9,
      summary: 'Heavy rainfall with potential flash flood.',
    });
  });

  it('returns null when required schema fields are invalid', () => {
    const parsed = parsePinTriageResult({
      predicted_urgency: 'UNKNOWN',
      urgency_confidence: 'not-a-number',
      summary: 'Invalid model payload',
    });

    expect(parsed).toBeNull();
  });
});
