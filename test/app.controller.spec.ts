import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('AppController', () => {
  let appController: AppController;

  beforeAll(async () => {
    const container = await new PostgreSqlContainer().start();
    process.env.DATABASE_URL = container.getConnectionUri();
  }, 30000);

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
