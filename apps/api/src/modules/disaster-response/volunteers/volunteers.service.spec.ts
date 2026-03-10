import { Test, TestingModule } from '@nestjs/testing';
import { VolunteersService } from './volunteers.service';
import { PrismaService } from '../../../core/database/database.service';
import { BadRequestException } from '@nestjs/common';

describe('VolunteersService', () => {
  let service: VolunteersService;

  const mockPrisma = {
    volunteerApplication: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    volunteerProfile: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolunteersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VolunteersService>(VolunteersService);
  });

  it('should prevent duplicate pending applications', async () => {
    mockPrisma.volunteerApplication.findFirst.mockResolvedValue({ id: 'existing-app' });

    await expect(service.apply('user-1', 'notes')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should allow applying if no pending application exists', async () => {
    mockPrisma.volunteerApplication.findFirst.mockResolvedValue(null);
    mockPrisma.volunteerApplication.create.mockResolvedValue({ id: 'new-app' });
    mockPrisma.volunteerProfile.upsert.mockResolvedValue({});

    const result = await service.apply('user-1', 'notes');

    expect(result).toEqual({ id: 'new-app' });
    expect(mockPrisma.volunteerProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: { status: 'PENDING' },
      create: { userId: 'user-1', status: 'PENDING' },
    });
  });
});
