import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createContainers, closeContainers, createUser } from '@test/helpers';
import { App } from 'supertest/types';
import { StartedTestContainer } from 'testcontainers';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '@/common/common.module';
import { ConfigModule } from '@nestjs/config';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';

describe('/auth/request-account-deletion', () => {
  let app: INestApplication<App>;
  let user: Awaited<ReturnType<typeof createUser>>;
  let token: string = '';
  let prisma: PrismaClient;
  let containers: StartedTestContainer[] = [];

  beforeAll(async () => {
    containers = await createContainers();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          global: true,
          secret: process.env.JWT_SECRET,
          signOptions: {
            issuer: process.env.JWT_ISSUER,
          },
        }),
        CommonModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [JwtTokenService],
    }).compile();

    const jwtTokenService = module.get(JwtTokenService);
    const passwordService = module.get(PasswordService);

    prisma = module.get(PrismaService);
    user = await createUser(prisma, passwordService);

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      scopes: [user.role],
    };

    token = jwtTokenService.create(payload, JwtTokenType.APP).token;
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
    it('should return an error when trying to request account delete without being signed in', async () => {
      const response = await request(app.getHttpServer()).post('/auth/account-deletion-request').send();

      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Access token is missing');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(401);
    });

    it('should create an account deletion token when user is signed in', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/account-deletion-request')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send();

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.data.expiration_date_in_millis).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBe(201);

      expect(prisma.accountDeletionCode).toBeDefined();

      const code = await prisma.accountDeletionCode.findFirst({
        where: { user_id: user.id },
      });

      expect(code).toBeDefined();
      expect(code!.code).toBeDefined();
      expect(new Date(code!.expires_at).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
