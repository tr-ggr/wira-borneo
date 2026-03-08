import { Test, TestingModule } from '@nestjs/testing';
import { AuthSessionGuard } from '../auth/auth-session.guard';
import { AuthService } from '../auth/auth.service';
import { GreetingsController } from './greetings.controller';
import { GreetingsService } from './greetings.service';

describe('GreetingsController', () => {
  let app: TestingModule;
  const greetingsServiceMock = {
    getData: jest.fn().mockResolvedValue({ message: 'Hello API' }),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [GreetingsController],
      providers: [
        {
          provide: GreetingsService,
          useValue: greetingsServiceMock,
        },
        {
          provide: AuthSessionGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: AuthService,
          useValue: { getSession: jest.fn() },
        },
      ],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', async () => {
      const controller = app.get<GreetingsController>(GreetingsController);
      await expect(controller.getData()).resolves.toEqual({
        message: 'Hello API',
      });
    });
  });
});
