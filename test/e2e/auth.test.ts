import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { faker } from '@faker-js/faker';
import { AppModule } from '@/app.module';
import request from 'supertest';
import { createContainers } from '@test/helpers';

describe('Authentication endpoints', () => {
  let app: INestApplication<App>;
  const user = {
    name: 'John Doe',
    username: 'john.doe',
    email: 'john.doe@helloworld.com',
    password: faker.internet.password({ length: 10 }),
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

  describe('POST /auth/register', () => {
    it('should register a new user and returns an authentication token and id, email and username', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send(user);

      expect(response.status).toBe(201);

      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.email).toBeDefined();
      expect(response.body.data.user.username).toBeDefined();

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(201);
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
      expect(response.body.message).toBeDefined();
      expect(/^Email .+@.+\..+ already exists/gim.test(response.body.message)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(400);
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
      expect(response.body.data.token).toBeDefined();
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
      expect(response.body.data.token).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBe(200);
    });
  });
});
