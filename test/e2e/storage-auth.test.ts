import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtTokenService } from '@/common/services/jwt-token.service';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { JwtTokenType } from '@/common/enums/jwt-token-type.enum';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

describe('Authentication endpoints', () => {
  let app: INestApplication<App>;
  let token: string = '';

  beforeAll(async () => {
    const container = await new PostgreSqlContainer().start();
    const connectionUri = container.getConnectionUri();
    process.env.DATABASE_URL = connectionUri;

    execSync('pnpm db:push', {
      env: {
        ...process.env,
        DATABASE_URL: connectionUri,
      },
    });
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

    const payload = {
      sub: faker.number.int({ min: 1, max: 100 }),
      email: faker.internet.email().toLowerCase(),
      username: faker.internet.username(),
    };

    token = module.get(JwtTokenService).create(payload, JwtTokenType.APP);
  });

  describe('POST /storage/', () => {
    it("should block request if jwt token isn't sent", async () => {
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
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(401);
    });

    it("should block request if jwt token isn't valid", async () => {
      const body = {
        type: 'avatars',
        context: 'upload',
      };

      const response = await request(app.getHttpServer())
        .set('Authorization', `Bearer ${faker.string.alphanumeric(10)}`)
        .post('/storage')
        .send(body);

      expect(response.status).toBe(401);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Access token is missing');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(401);
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
      expect(response.body.token).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(200);
    });
  });
});
