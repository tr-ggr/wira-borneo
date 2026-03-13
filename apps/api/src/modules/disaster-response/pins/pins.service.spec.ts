import { PinsService } from './pins.service';
import type { PinTriageService } from './pin-triage.service';

describe('PinsService', () => {
  const createMock = jest.fn();
  const prismaMock = {
    mapPinStatus: {
      create: createMock,
    },
  };

  const triageMock = {
    triage: jest.fn(),
  };

  let service: PinsService;

  beforeEach(() => {
    createMock.mockReset();
    triageMock.triage.mockReset();
    service = new PinsService(prismaMock as never, triageMock as unknown as PinTriageService);
  });

  it('auto-approves pin at or above confidence threshold', async () => {
    triageMock.triage.mockResolvedValue({
      predictedUrgency: 'HIGH',
      urgencyConfidence: 0.9,
      summary: 'Floodwater is rising quickly.',
    });
    createMock.mockResolvedValue({ id: 'pin-1' });

    await service.create({
      reporterId: 'user-1',
      title: 'Flooded road near market',
      hazardType: 'FLOOD',
      latitude: 1.123,
      longitude: 103.456,
      note: 'Water above knee level',
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reviewStatus: 'APPROVED',
        priority: 3,
        status: 'OPEN',
        reviewNote: expect.stringContaining('"predicted_urgency":"HIGH"'),
      }),
    });
  });

  it('keeps pin pending below confidence threshold', async () => {
    triageMock.triage.mockResolvedValue({
      predictedUrgency: 'MEDIUM',
      urgencyConfidence: 0.6,
      summary: 'Localized disruption likely.',
    });
    createMock.mockResolvedValue({ id: 'pin-2' });

    await service.create({
      reporterId: 'user-2',
      title: 'Debris on roadway',
      hazardType: 'TYPHOON',
      latitude: 2.345,
      longitude: 102.111,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reviewStatus: 'PENDING',
        priority: 2,
        status: 'OPEN',
        reviewNote: expect.stringContaining('"summary":"Localized disruption likely."'),
      }),
    });
  });

  it('falls back to pending when triage is unavailable', async () => {
    triageMock.triage.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: 'pin-3' });

    await service.create({
      reporterId: 'user-3',
      title: 'Possible aftershock impact',
      hazardType: 'AFTERSHOCK',
      latitude: 3.5,
      longitude: 101.7,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reviewStatus: 'PENDING',
        priority: 1,
        status: 'OPEN',
      }),
    });
    expect(createMock.mock.calls[0][0].data.reviewNote).toBeUndefined();
  });
});
