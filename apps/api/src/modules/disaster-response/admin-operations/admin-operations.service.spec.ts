import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminOperationsService } from './admin-operations.service';
import { PrismaService } from '../../../core/database/database.service';
import { RiskIntelligenceService } from '../risk-intelligence/risk-intelligence.service';
import { OpenMeteoService } from '../../../providers/open-meteo/open-meteo.service';

describe('AdminOperationsService', () => {
  let service: AdminOperationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    volunteerApplication: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    volunteerProfile: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    volunteerDecisionLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminOperationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RiskIntelligenceService, useValue: {} },
        { provide: OpenMeteoService, useValue: {} },
      ],
    }).compile();

    service = module.get<AdminOperationsService>(AdminOperationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('reviewVolunteerApplication', () => {
    it('should throw if REJECTED without reason', async () => {
      await expect(
        service.reviewVolunteerApplication({
          applicationId: 'app-1',
          reviewerId: 'admin-1',
          nextStatus: 'REJECTED',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve application and update profile', async () => {
      mockPrisma.volunteerApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        status: 'PENDING',
      });

      await service.reviewVolunteerApplication({
        applicationId: 'app-1',
        reviewerId: 'admin-1',
        nextStatus: 'APPROVED',
      });

      expect(mockPrisma.volunteerApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      });
      expect(mockPrisma.volunteerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      });
    });
  });

  describe('suspendVolunteer', () => {
    it('should suspend profile and log decision', async () => {
      mockPrisma.volunteerProfile.findUnique.mockResolvedValue({ userId: 'user-1', status: 'APPROVED' });
      mockPrisma.volunteerApplication.findFirst.mockResolvedValue({ id: 'app-1' });

      await service.suspendVolunteer('user-1', 'admin-1', 'suspension reason');

      expect(mockPrisma.volunteerProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { status: 'SUSPENDED' },
      });
      expect(mockPrisma.volunteerDecisionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nextStatus: 'SUSPENDED',
          reason: 'suspension reason',
        }),
      });
    });
  });
});
