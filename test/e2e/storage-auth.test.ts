import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { createContainers } from '@test/helpers';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';

describe('Authentication endpoints', () => {
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
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
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
    token = jwtTokenService.create(tokenPayload, JwtTokenType.APP);
  });

  describe('POST /storage/', () => {
    it("should block request if jwt token isn't sent in authorization header", async () => {
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

    it("should block request if jwt token isn't starts with 'Bearer '", async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const response = await request(app.getHttpServer()).post('/storage').set('Authorization', token).send(body);

      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Access token is missing');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(401);
    });

    it("should block request if jwt token isn't valid", async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const response = await request(app.getHttpServer())
        .post('/storage')
        .set('Authorization', `Bearer ${faker.string.alphanumeric(10)}`)
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
        .set('Authorization', `Bearer ${expiredToken}`)
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
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });
  });
});
