import { Test } from '@nestjs/testing';
import { GreetingsRepository } from './repositories/greetings.repository';
import { GreetingsService } from './greetings.service';

describe('GreetingsService', () => {
  let service: GreetingsService;
  const greetingsRepositoryMock = {
    getHomeGreeting: jest.fn().mockResolvedValue({
      key: 'home',
      message: 'Hello API',
    }),
  };

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        GreetingsService,
        {
          provide: GreetingsRepository,
          useValue: greetingsRepositoryMock,
        },
      ],
    }).compile();

    service = app.get<GreetingsService>(GreetingsService);
  });

  describe('getData', () => {
    it('should return "Hello API"', async () => {
      await expect(service.getData()).resolves.toEqual({ message: 'Hello API' });
      expect(greetingsRepositoryMock.getHomeGreeting).toHaveBeenCalledTimes(1);
    });
  });
});
