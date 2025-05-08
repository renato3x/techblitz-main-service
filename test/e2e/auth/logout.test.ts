import { AppModule } from '@/app.module';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { closeContainers, createContainers } from '@test/helpers';
import { App } from 'supertest/types';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { StartedTestContainer } from 'testcontainers';

describe('/auth/logout', () => {
  let app: INestApplication<App>;
  let token: string = '';
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
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [JwtTokenService],
    }).compile();

    const payload = {
      sub: faker.string.uuid(),
      email: faker.internet.email().toLowerCase(),
      username: faker.internet.username().toLowerCase(),
      scopes: [Role.USER],
    };

    const jwtTokenService = module.get(JwtTokenService);
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
    it('should logout user removing auth token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send();

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const authTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith(`${process.env.AUTH_TOKEN_COOKIE_NAME}=`),
      );

      expect(authTokenCookie).toBeDefined();
      expect(authTokenCookie).toContain('Expires=Thu, 01 Jan 1970');
    });
  });
});
