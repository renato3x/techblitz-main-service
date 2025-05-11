import { AppModule } from '@/app.module';
import { CommonModule } from '@/common/common.module';
import { PasswordService } from '@/common/services/password.service';
import { PrismaService } from '@/common/services/prisma.service';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { closeContainers, createContainers, createUser } from '@test/helpers';
import { App } from 'supertest/types';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import { StartedTestContainer } from 'testcontainers';
import { AuthService } from '@/auth/auth.service';
import { DateTime } from 'luxon';
import { PrismaClient } from '@prisma/client';
import { EventEmitterModule } from '@/event-emitter/event-emitter.module';

describe('/auth/user', () => {
  let app: INestApplication<App>;
  let user: Awaited<ReturnType<typeof createUser>>;
  let token: string = '';
  let containers: StartedTestContainer[] = [];
  let authService: AuthService;
  let prisma: PrismaClient;

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
        EventEmitterModule.forRoot({ provider: process.env.EVENT_EMITTER_PROVIDER }),
      ],
      providers: [JwtTokenService, AuthService],
    }).compile();

    const jwtTokenService = module.get(JwtTokenService);
    const passwordService = module.get(PasswordService);
    prisma = module.get(PrismaService);

    authService = module.get(AuthService);
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

  describe('GET', () => {
    it('should logged user data if access token is valid', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/user')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.username).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.role).toBeDefined();
      expect(response.body.data.role).toBe('USER');
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.data).toHaveProperty('avatar_url');
      expect(response.body.data).toHaveProperty('avatar_fallback');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).not.toHaveProperty('password');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should update data from signed in user', async () => {
      const data = {
        name: 'Doe John',
        username: 'doe_john_586',
        email: faker.internet.email().toLowerCase(),
        bio: faker.lorem.paragraph(1).substring(0, 100),
      };

      const response = await request(app.getHttpServer())
        .patch('/auth/user')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send(data);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.username).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.role).toBeDefined();
      expect(response.body.data.role).toBe('USER');
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.data).toHaveProperty('avatar_url');
      expect(response.body.data).toHaveProperty('avatar_fallback');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).not.toHaveProperty('password');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const authTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith(`${process.env.AUTH_TOKEN_COOKIE_NAME}=`),
      );

      expect(authTokenCookie).toBeDefined();
      expect(authTokenCookie).toContain('HttpOnly');
      expect(authTokenCookie).toContain('SameSite=Strict');
    });
  });

  describe('DELETE', () => {
    it('should block account deletion if user is not signed in', async () => {
      const response = await request(app.getHttpServer()).delete('/auth/user').send({
        code: authService.generateAccountDeletionCode(),
      });

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

    it('should block user deletion if deletion code is not sent', async () => {
      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('"code" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block user deletion if deletion code is not a number', async () => {
      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({ code: 'NaNcd' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('"code" must be numeric');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block user deletion if deletion code length is greater than 5', async () => {
      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({ code: '123456' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('"code" must have 5 numbers');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block user deletion if deletion code length is less than 5', async () => {
      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({ code: '1234' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('"code" must have 5 numbers');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block user deletion if deletion code is different', async () => {
      const expirationTimeInMinutes = +process.env.ACCOUNT_DELETION_CODE_TTL_IN_MINUTES;

      const code = await prisma.accountDeletionCode.create({
        data: {
          code: authService.generateAccountDeletionCode(),
          expires_at: DateTime.utc().plus({ minutes: expirationTimeInMinutes }).toJSDate(),
          user_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({ code: '12345' });

      expect(response.status).toBe(403);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Invalid deletion code');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(403);

      await prisma.accountDeletionCode.delete({
        where: {
          id: code.id,
        },
      });
    });

    it('should block user deletion if deletion code is expired', async () => {
      const expirationTimeInMinutes = +process.env.ACCOUNT_DELETION_CODE_TTL_IN_MINUTES;

      const code = await prisma.accountDeletionCode.create({
        data: {
          code: authService.generateAccountDeletionCode(),
          expires_at: DateTime.utc()
            .minus({ minutes: expirationTimeInMinutes * 2 })
            .toJSDate(),
          user_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({ code: code.code });

      expect(response.status).toBe(403);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Code already expired');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(403);

      const count = await prisma.accountDeletionCode.count({
        where: { user_id: user.id },
      });

      expect(count).toBe(0);
    });

    it('should delete user and remove current access token', async () => {
      const expirationTimeInMinutes = +process.env.ACCOUNT_DELETION_CODE_TTL_IN_MINUTES;

      const code = await prisma.accountDeletionCode.create({
        data: {
          code: authService.generateAccountDeletionCode(),
          expires_at: DateTime.utc().plus({ minutes: expirationTimeInMinutes }).toJSDate(),
          user_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .delete('/auth/user')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
        .send({ code: code.code });

      expect(response.status).toBe(204);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({});

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const authTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith(`${process.env.AUTH_TOKEN_COOKIE_NAME}=`),
      );

      expect(authTokenCookie).toBeDefined();
      expect(authTokenCookie).toContain('Expires=Thu, 01 Jan 1970');

      const count = await prisma.accountDeletionCode.count({
        where: {
          user_id: user.id,
        },
      });

      expect(count).toBe(0);

      const userCount = await prisma.user.count({
        where: {
          id: user.id,
        },
      });

      expect(userCount).toBe(0);
    });
  });
});
