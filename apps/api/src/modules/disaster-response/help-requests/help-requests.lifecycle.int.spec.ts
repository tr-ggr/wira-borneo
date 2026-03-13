import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HelpRequestsController } from './help-requests.controller';
import { HelpRequestsService } from './help-requests.service';
import { AuthSessionGuard } from '../../auth/auth-session.guard';
import { AuthService } from '../../auth/auth.service';
import { ApprovedVolunteerGuard } from '../shared/approved-volunteer.guard';
import { DisasterPolicyService } from '../shared/disaster-policy.service';
import { PrismaService } from '../../../core/database/database.service';
import { HelpRequestTriageService } from './help-request-triage.service';

describe('HelpRequests Lifecycle (Integration)', () => {
  let controller: HelpRequestsController;
  let service: HelpRequestsService;
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  const mockPrisma = {
    helpRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    helpAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    helpRequestEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const triageServiceMock = {
    triage: jest.fn(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [HelpRequestsController],
      providers: [
        HelpRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HelpRequestTriageService, useValue: triageServiceMock },
        { provide: AuthService, useValue: { getSession: jest.fn() } },
        { provide: AuthSessionGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        { provide: ApprovedVolunteerGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        {
          provide: DisasterPolicyService,
          useValue: { isApprovedVolunteer: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = moduleRef.get<HelpRequestsController>(HelpRequestsController);
    service = moduleRef.get<HelpRequestsService>(HelpRequestsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a help request, persist AI metadata, and keep mobile response AI-safe', async () => {
    const dto = {
      hazardType: 'FLOOD' as const,
      urgency: 'HIGH' as const,
      description: 'Stuck on roof',
      latitude: 1.5,
      longitude: 110.3,
    };
    const session = { user: { id: 'requester-1' } } as any;

    triageServiceMock.triage.mockResolvedValue({
      predictedUrgency: 'CRITICAL',
      urgencyConfidence: 0.91,
    });

    mockPrisma.helpRequest.create.mockResolvedValue({
      id: 'hr-1',
      ...dto,
      requesterId: 'requester-1',
      familyId: null,
      status: 'OPEN',
      sosExpiresAt: null,
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      predictedUrgency: 'CRITICAL',
      urgencyConfidence: 0.91,
    });

    const result = await controller.create(session, dto);

    expect(result.id).toBe('hr-1');
    expect(mockPrisma.helpRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          predictedUrgency: 'CRITICAL',
          urgencyConfidence: 0.91,
        }),
      }),
    );
    expect(result).not.toHaveProperty('predictedUrgency');
    expect(result).not.toHaveProperty('urgencyConfidence');
  });

  it('should create SOS request and fallback to null AI metadata on triage failure', async () => {
    const session = { user: { id: 'requester-1' } } as any;
    triageServiceMock.triage.mockResolvedValue(null);

    mockPrisma.helpRequest.create.mockResolvedValue({
      id: 'hr-sos-1',
      requesterId: 'requester-1',
      familyId: null,
      hazardType: 'FLOOD',
      urgency: 'CRITICAL',
      status: 'OPEN',
      description: 'SOS',
      latitude: 1.5,
      longitude: 110.3,
      sosExpiresAt: new Date('2026-03-13T00:15:00.000Z'),
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      predictedUrgency: null,
      urgencyConfidence: null,
    });

    const result = await controller.createSos(session, { latitude: 1.5, longitude: 110.3 });

    expect(mockPrisma.helpRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          predictedUrgency: null,
          urgencyConfidence: null,
        }),
      }),
    );
    expect(result).not.toHaveProperty('predictedUrgency');
    expect(result).not.toHaveProperty('urgencyConfidence');
  });

  it('should keep list endpoints AI-safe', async () => {
    const session = { user: { id: 'vol-1' } } as any;
    mockPrisma.helpRequest.findMany.mockResolvedValue([
      {
        id: 'hr-1',
        requesterId: 'requester-1',
        familyId: null,
        hazardType: 'FLOOD',
        urgency: 'HIGH',
        predictedUrgency: 'CRITICAL',
        urgencyConfidence: 0.88,
        status: 'OPEN',
        description: 'Need rescue',
        latitude: 1,
        longitude: 110,
        sosExpiresAt: null,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
        requester: { name: 'A' },
        assignments: [],
        events: [],
      },
    ]);

    const mine = await controller.me({ user: { id: 'requester-1' } } as any);
    const open = await controller.listOpen(session);

    expect(mine[0]).not.toHaveProperty('predictedUrgency');
    expect(mine[0]).not.toHaveProperty('urgencyConfidence');
    expect(open[0]).not.toHaveProperty('predictedUrgency');
    expect(open[0]).not.toHaveProperty('urgencyConfidence');
  });

  it('should claim a help request', async () => {
    const session = { user: { id: 'volunteer-1' } } as any;
    mockPrisma.helpRequest.findUnique.mockResolvedValue({ id: 'hr-1', status: 'OPEN' });
    mockPrisma.helpAssignment.create.mockResolvedValue({
      id: 'as-1',
      helpRequestId: 'hr-1',
      volunteerId: 'volunteer-1',
      status: 'CLAIMED',
      assignedAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
    });

    const result = await controller.claim('hr-1', session);
    expect(result.id).toBe('as-1');
    expect(mockPrisma.helpAssignment.create).toHaveBeenCalled();
    expect(mockPrisma.helpRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'CLAIMED' },
    }));
  });

  it('should update assignment status with AI-safe response', async () => {
    const session = { user: { id: 'volunteer-1' } } as any;
    mockPrisma.helpAssignment.findFirst.mockResolvedValue({ id: 'as-1', helpRequestId: 'hr-1' });
    mockPrisma.helpRequest.update.mockResolvedValue({
      id: 'hr-1',
      requesterId: 'requester-1',
      familyId: null,
      hazardType: 'FLOOD',
      urgency: 'HIGH',
      predictedUrgency: 'CRITICAL',
      urgencyConfidence: 0.92,
      status: 'IN_PROGRESS',
      description: 'Need help',
      latitude: 1,
      longitude: 110,
      sosExpiresAt: null,
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:05:00.000Z'),
    });

    const result = await controller.updateStatus('hr-1', session, { nextStatus: 'IN_PROGRESS' });
    expect(result.status).toBe('IN_PROGRESS');
    expect(result).not.toHaveProperty('predictedUrgency');
    expect(result).not.toHaveProperty('urgencyConfidence');
    expect(mockPrisma.helpAssignment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'ON_SITE' },
    }));
  });

  it('should omit AI triage fields from OpenAPI public help-request contracts', async () => {
    const app = moduleRef.createNestApplication();
    await app.init();

    const openApiDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').setVersion('1').build(),
    );

    const schemaNames = [
      'HelpRequestResponseDto',
      'HelpRequestWithHistoryResponseDto',
      'OpenHelpRequestResponseDto',
      'HelpRequestForAssignmentResponseDto',
      'VolunteerAssignmentResponseDto',
    ];

    for (const schemaName of schemaNames) {
      const properties = openApiDocument.components?.schemas?.[schemaName]?.properties ?? {};
      expect(properties).not.toHaveProperty('predictedUrgency');
      expect(properties).not.toHaveProperty('urgencyConfidence');
    }

    await app.close();
  });

  it('should resolve service and prisma providers', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });
});
