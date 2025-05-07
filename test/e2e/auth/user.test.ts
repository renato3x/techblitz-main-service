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

describe('/auth/user', () => {
  let app: INestApplication<App>;
  let user: Awaited<ReturnType<typeof createUser>>;
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
        CommonModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [JwtTokenService],
    }).compile();

    const jwtTokenService = module.get(JwtTokenService);
    const prisma = module.get(PrismaService);
    const passwordService = module.get(PasswordService);

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
});
