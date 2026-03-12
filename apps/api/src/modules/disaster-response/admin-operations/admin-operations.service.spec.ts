import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminOperationsService } from './admin-operations.service';
import { PrismaService } from '../../../core/database/database.service';
import { RiskIntelligenceService } from '../risk-intelligence/risk-intelligence.service';
import { OpenMeteoService } from '../../../providers/open-meteo/open-meteo.service';
import { AssistantService } from '../assistant/assistant.service';

describe('AdminOperationsService', () => {
  let service: AdminOperationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    volunteerApplication: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
    warningEvent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    warningEventLog: {
      create: jest.fn(),
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
        { provide: AssistantService, useValue: { answerInquiry: jest.fn() } },
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
  describe('createWarning', () => {
    it('should create warning and log with CREATE action', async () => {
      mockPrisma.warningEvent.create.mockResolvedValue({ id: 'warning-1' });

      await service.createWarning({
        title: 'Title',
        message: 'Message',
        hazardType: 'FLOOD',
        severity: 'HIGH',
        startsAt: new Date(),
        creatorId: 'admin-1',
        targets: [{ areaName: 'Zone A' }],
        evacuationAreaIds: [],
      });

      expect(mockPrisma.warningEventLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE',
          status: 'SENT',
        }),
      });
    });
  });

  describe('updateWarning', () => {
    it('should update warning and log with UPDATE action', async () => {
      mockPrisma.warningEvent.findUnique.mockResolvedValue({ id: 'warning-1', status: 'SENT' });
      mockPrisma.warningEvent.update.mockResolvedValue({ id: 'warning-1', status: 'SENT' });

      await service.updateWarning({
        warningId: 'warning-1',
        title: 'Updated Title',
        actorId: 'admin-1',
      });

      expect(mockPrisma.warningEventLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE',
        }),
      });
    });
  });

  describe('cancelWarning', () => {
    it('should cancel warning and log with CANCEL action', async () => {
      mockPrisma.warningEvent.findUnique.mockResolvedValue({ id: 'warning-1', status: 'SENT' });
      mockPrisma.warningEvent.update.mockResolvedValue({ id: 'warning-1', status: 'CANCELLED' });

      await service.cancelWarning('warning-1', 'admin-1');

      expect(mockPrisma.warningEvent.update).toHaveBeenCalledWith({
        where: { id: 'warning-1' },
        data: { status: 'CANCELLED' },
      });
      expect(mockPrisma.warningEventLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CANCEL',
          status: 'CANCELLED',
        }),
      });
    });
  });

  describe('listWarnings', () => {
    it('should list warnings filtered by status', async () => {
      mockPrisma.warningEvent.findMany.mockResolvedValue([{ id: 'warning-1' }]);

      await service.listWarnings({ status: 'SENT' });

      expect(mockPrisma.warningEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'SENT' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('deleteWarning', () => {
    it('should delete warning when it exists', async () => {
      mockPrisma.warningEvent.findUnique.mockResolvedValue({ id: 'warning-1' });
      mockPrisma.warningEvent.delete.mockResolvedValue({ id: 'warning-1' });

      await service.deleteWarning('warning-1');

      expect(mockPrisma.warningEvent.delete).toHaveBeenCalledWith({
        where: { id: 'warning-1' },
      });
    });

    it('should throw when deleting non-existent warning', async () => {
      mockPrisma.warningEvent.findUnique.mockResolvedValue(null);

      await expect(service.deleteWarning('missing-warning')).rejects.toThrow();
    });
  });
});
