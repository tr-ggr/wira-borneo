import { BadRequestException } from '@nestjs/common';
import { AdminOperationsService } from './admin-operations.service';

describe('AdminOperationsService', () => {
  const prismaMock = {
    volunteerApplication: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    volunteerProfile: {
      upsert: jest.fn(),
    },
    volunteerDecisionLog: {
      create: jest.fn(),
    },
    warningEvent: {
      create: jest.fn(),
    },
    warningEventLog: {
      create: jest.fn(),
    },
    mapPinStatus: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const riskServiceMock = {
    getVulnerableRegions: jest.fn(),
  };

  let service: AdminOperationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminOperationsService(prismaMock as never, riskServiceMock as never);
  });

  it('prevents duplicate final decisions on volunteer applications', async () => {
    prismaMock.volunteerApplication.findUnique.mockResolvedValue({
      id: 'app-1',
      userId: 'user-1',
      status: 'APPROVED',
    });

    await expect(
      service.reviewVolunteerApplication({
        applicationId: 'app-1',
        reviewerId: 'admin-1',
        nextStatus: 'REJECTED',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('returns volunteer applications with applicant metadata', async () => {
    prismaMock.volunteerApplication.findMany.mockResolvedValue([{ id: 'app-1' }]);

    await expect(service.listVolunteerApplications('PENDING')).resolves.toEqual([
      { id: 'app-1' },
    ]);

    expect(prismaMock.volunteerApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PENDING' },
      }),
    );
  });
});
