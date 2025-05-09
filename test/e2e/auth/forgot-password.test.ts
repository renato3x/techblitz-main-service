import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { App } from 'supertest/types';
import { closeContainers, createContainers, createUser } from '@test/helpers';
import { CommonModule } from '@/common/common.module';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import { AppModule } from '@/app.module';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { StartedTestContainer } from 'testcontainers';

describe('/auth/forgot-password', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let user: Awaited<ReturnType<typeof createUser>>;
  let containers: StartedTestContainer[] = [];

  beforeAll(async () => {
    containers = await createContainers();
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    prisma = module.get(PrismaService);
    const passwordService = module.get(PasswordService);
    user = await createUser(prisma, passwordService);
  }, 30000);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeContainers(containers);
  });

  describe('POST', () => {
    it('should create a recovery token for a valid user email', async () => {
      const response = await request(app.getHttpServer()).post('/auth/forgot-password').send({ email: user.email });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.data.expiration_date_in_millis).toBeDefined();

      expect(prisma.accountRecoveryToken).toBeDefined();

      const token = await prisma?.accountRecoveryToken?.findFirst({
        where: { user_id: user.id },
      });

      expect(token).toBeDefined();
      expect(token!.token).toBeDefined();
      expect(new Date(token!.expires_at).getTime()).toBeGreaterThan(Date.now());
    });

    it('should return an error if email is not registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User not found');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBe(404);
    });

    it('should return an error if email is not valid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email-format' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('"email" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
    });
  });
});
