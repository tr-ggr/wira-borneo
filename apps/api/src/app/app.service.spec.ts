import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppService', () => {
  let service: AppService;
  const prismaMock = {
    greeting: {
      upsert: jest.fn().mockResolvedValue({ message: 'Hello API' }),
    },
  };

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', async () => {
      await expect(service.getData()).resolves.toEqual({ message: 'Hello API' });
      expect(prismaMock.greeting.upsert).toHaveBeenCalledWith({
        where: { key: 'home' },
        create: { key: 'home', message: 'Hello API' },
        update: {},
      });
    });
  });
});
