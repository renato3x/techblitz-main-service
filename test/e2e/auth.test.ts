import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { App } from 'supertest/types';
import { faker } from '@faker-js/faker';
import { execSync } from 'child_process';
import { AppModule } from '@/app.module';
import request from 'supertest';

describe('Authentication endpoints', () => {
  let app: INestApplication<App>;
  const user = {
    name: faker.person.fullName(),
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    bio: faker.lorem.text().slice(0, 100),
  };

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

  describe('POST /auth/register', () => {
    it('should register a new user and returns an authentication token and id, email and username', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send(user);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.email).toBeDefined();
      expect(response.body.user.username).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(201);
    });

    it('should block the registration of a new user if email already exists', async () => {
      const body = {
        name: faker.person.fullName(),
        username: faker.internet.username().toLowerCase(),
        email: user.email,
        password: faker.internet.password({ length: 8 }),
        bio: faker.lorem.text().slice(0, 100),
      };

      const response = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(/^Email .+@.+\..+ already exists/gim.test(response.body.message)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(400);
    });

    it('should block the registration of a new user if username already exists', async () => {
      const body = {
        name: faker.person.fullName(),
        username: user.username,
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password({ length: 8 }),
        bio: faker.lorem.text().slice(0, 100),
      };

      const response = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(/^Username .+ already exists/gim.test(response.body.message)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user by username and password', async () => {
      const body = {
        username: user.username,
        password: user.password,
      };

      const response = await request(app.getHttpServer()).post('/auth/login').send(body);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(200);
    });

    it('should login user by email and password', async () => {
      const body = {
        email: user.email,
        password: user.password,
      };

      const response = await request(app.getHttpServer()).post('/auth/login').send(body);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(200);
    });
  });
});
