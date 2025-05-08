import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { closeContainers, createContainers } from '@test/helpers';
import { App } from 'supertest/types';
import { faker } from '@faker-js/faker';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { StartedTestContainer } from 'testcontainers';

describe('/auth/register', () => {
  let app: INestApplication<App>;
  const user = {
    name: 'John Doe',
    username: 'john.doe',
    email: 'john.doe@helloworld.com',
    password: faker.internet.password({ length: 10 }),
  };
  let containers: StartedTestContainer[] = [];

  beforeAll(async () => {
    containers = await createContainers();
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
    it('should register a new user and return user data with the auth token in an HTTP-only cookie', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send(user);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.name).toBeDefined();
      expect(response.body.data.user.username).toBeDefined();
      expect(response.body.data.user.email).toBeDefined();
      expect(response.body.data.user.role).toBeDefined();
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.created_at).toBeDefined();
      expect(response.body.data.user).toHaveProperty('avatar_url');
      expect(response.body.data.user).toHaveProperty('avatar_fallback');
      expect(response.body.data.user).not.toHaveProperty('password');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(201);

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

    it('should block the registration of a new user if email already exists', async () => {
      const body = {
        name: 'Fake User',
        username: 'fake.user00',
        email: user.email,
        password: faker.internet.password({ length: 10 }),
      };

      const response = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Email already exists');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block the registration of a new user if username already exists', async () => {
      const body = {
        name: 'Fake User',
        username: user.username,
        email: 'fake.user@fake.com',
        password: faker.internet.password({ length: 10 }),
      };

      const response = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Username already exists');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });
  });
});
