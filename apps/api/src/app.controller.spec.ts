import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue({
              message: 'Hello Takda! Welcome to the NestJS API!',
              timestamp: new Date('2026-07-19T11:07:38+08:00'),
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHello', () => {
    it('should return hello message', () => {
      expect(appController.getHello()).toEqual({
        message: 'Hello Takda! Welcome to the NestJS API!',
        timestamp: new Date('2026-07-19T11:07:38+08:00'),
      });
    });
  });
});
