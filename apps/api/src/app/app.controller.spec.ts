import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthSessionGuard } from './auth/auth-session.guard';
import { AuthService } from './auth/auth.service';

describe('AppController', () => {
  let app: TestingModule;
  const appServiceMock = {
    getData: jest.fn().mockResolvedValue({ message: 'Hello API' }),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
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
      const appController = app.get<AppController>(AppController);
      await expect(appController.getData()).resolves.toEqual({
        message: 'Hello API',
      });
    });
  });
});
