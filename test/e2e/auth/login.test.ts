import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { closeContainers, createContainers, createUser } from '@test/helpers';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@/common/common.module';
import { PrismaService } from '@/common/services/prisma.service';
import { PasswordService } from '@/common/services/password.service';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { StartedTestContainer } from 'testcontainers';

describe('POST /auth/login', () => {
  let app: INestApplication<App>;
  let user: Awaited<ReturnType<typeof createUser>>;
  let containers: StartedTestContainer[] = [];

  beforeAll(async () => {
    containers = await createContainers();
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    const prisma = module.get(PrismaService);
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

  it('should login user by username and password', async () => {
    const body = {
      username: user.username,
      password: user.password,
    };

    const response = await request(app.getHttpServer()).post('/auth/login').send(body);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    expect(response.body.data).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.id).toBeDefined();
    expect(response.body.data.user.name).toBeDefined();
    expect(response.body.data.user.username).toBeDefined();
    expect(response.body.data.user.email).toBeDefined();
    expect(response.body.data.user.created_at).toBeDefined();
    expect(response.body.data.user).toHaveProperty('avatar_url');
    expect(response.body.data.user).toHaveProperty('avatar_fallback');
    expect(response.body.data.user).not.toHaveProperty('password');

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

  it('should login user by email and password', async () => {
    const body = {
      email: user.email,
      password: user.password,
    };

    const response = await request(app.getHttpServer()).post('/auth/login').send(body);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    expect(response.body.data).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.id).toBeDefined();
    expect(response.body.data.user.name).toBeDefined();
    expect(response.body.data.user.username).toBeDefined();
    expect(response.body.data.user.email).toBeDefined();
    expect(response.body.data.user.created_at).toBeDefined();
    expect(response.body.data.user).toHaveProperty('avatar_url');
    expect(response.body.data.user).toHaveProperty('avatar_fallback');
    expect(response.body.data.user).not.toHaveProperty('password');

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
