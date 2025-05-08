import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { closeContainers, createAccountRecoveryToken, createContainers, createUser } from '@test/helpers';
import { App } from 'supertest/types';
import { DateTime } from 'luxon';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@/common/common.module';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import { AppModule } from '@/app.module';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { StartedTestContainer } from 'testcontainers';

describe('/auth/reset-password', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let user: Awaited<ReturnType<typeof createUser>>;
  let changePasswordToken: string = '';
  let containers: StartedTestContainer[] = [];

  beforeAll(async () => {
    containers = await createContainers();
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
    const passwordService = module.get(PasswordService);

    prisma = module.get(PrismaService);
    user = await createUser(prisma, passwordService);
    changePasswordToken = await createAccountRecoveryToken(prisma, user.id);
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

  it('should return an error if token is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ password: 'validPassword123' });

    expect(response.status).toBe(400);
    expect(response.body).toBeDefined();
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toContain('"token" is required');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.status_code).toBeDefined();
    expect(response.body.status_code).toBe(400);
  });

  describe('POST', () => {
    it('should return an error if token is not a valid UUID', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'not-a-uuid', password: 'validPassword123' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"token" must be an uuid');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an error if password is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'a8098c1a-f86e-11da-bd1a-00112444be1e' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"password" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an error if password is empty string', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'a8098c1a-f86e-11da-bd1a-00112444be1e', password: '' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"password" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an error if password has less than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'a8098c1a-f86e-11da-bd1a-00112444be1e', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"password" must have at least 8 characters');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an error if token is not valid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: faker.string.uuid(), password: 'new_password' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Token is not valid');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an error if new password is equal to current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: changePasswordToken, password: user.password });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('New password must be different from current password');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should reset password with valid token', async () => {
      const newPassword = faker.internet.password({ length: 20 });

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: changePasswordToken, password: newPassword });

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const token = await prisma.accountRecoveryToken.findFirst({
        where: { token: changePasswordToken },
      });

      expect(token).toBeNull();
    });

    it('should return an error if token has expired', async () => {
      const expirationTimeInMinutes = +process.env.ACCOUNT_RECOVERY_TOKEN_TTL_IN_MINUTES;
      const expiredDate = DateTime.utc()
        .minus({ minutes: expirationTimeInMinutes * 2 })
        .toJSDate();
      const expiredToken = await prisma.accountRecoveryToken.create({
        data: {
          user_id: user.id,
          expires_at: expiredDate,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: expiredToken.token, password: 'somestrongpassword' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Token has expired');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);

      const token = await prisma.accountRecoveryToken.findFirst({
        where: { id: expiredToken.id },
      });

      expect(token).toBeNull();
    });
  });
});
