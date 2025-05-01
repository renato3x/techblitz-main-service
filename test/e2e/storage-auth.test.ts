import request from 'supertest';
import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { createContainers, closeContainers } from '@test/helpers';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';

describe('Storage authentication endpoints', () => {
  let app: INestApplication<App>;
  let token: string = '';
  let jwtTokenService: JwtTokenService;

  const tokenPayload = {
    sub: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    username: faker.internet.username().toLowerCase(),
  };

  beforeAll(async () => {
    await createContainers();
  }, 30000);

  beforeEach(async () => {
    await app?.close();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          global: true,
          secret: process.env.JWT_SECRET,
          signOptions: {
            issuer: process.env.JWT_ISSUER,
          },
        }),
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [JwtTokenService],
    }).compile();

    jwtTokenService = module.get(JwtTokenService);
    token = jwtTokenService.create(tokenPayload, JwtTokenType.APP).token;
  });

  afterAll(async () => {
    await closeContainers();
  });

  describe('POST /storage', () => {
    it('should block request if option "type" is not sent within the body', async () => {
      const body = {
        context: 'upload',
      };

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"type" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block request if option "context" is not sent within the body', async () => {
      const body = {
        type: 'avatars',
      };

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"context" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it(`should block request if jwt token is not sent in ${process.env.AUTH_TOKEN_COOKIE_NAME} cookie`, async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const response = await request(app.getHttpServer()).post('/storage').send(body);

      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Access token is missing');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(401);
    });

    it('should block request if jwt token is not valid', async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${faker.string.alphanumeric(10)}`])
        .send(body);

      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Access token is invalid');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(401);
    });

    it('should block request if jwt token is expired', async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const expiredToken = jwtTokenService.create(tokenPayload, JwtTokenType.EXPIRED);

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${expiredToken}`])
        .send(body);

      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Access token is invalid');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(401);
    });

    it('should return an avatar upload jwt token', async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send(body);

      expect(response.status).toBe(204);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({});

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const authTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith(`${process.env.STORAGE_AUTH_TOKEN_COOKIE_NAME}=`),
      );

      expect(authTokenCookie).toBeDefined();
      expect(authTokenCookie).toContain('HttpOnly');
      expect(authTokenCookie).toContain('SameSite=None');
    });

    it('should return an avatar delete jwt token', async () => {
      const body = {
        type: 'avatars',
        context: 'delete',
      };

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send(body);

      expect(response.status).toBe(204);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual({});

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const authTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith(`${process.env.STORAGE_AUTH_TOKEN_COOKIE_NAME}=`),
      );

      expect(authTokenCookie).toBeDefined();
      expect(authTokenCookie).toContain('HttpOnly');
      expect(authTokenCookie).toContain('SameSite=None');
    });
  });
});
