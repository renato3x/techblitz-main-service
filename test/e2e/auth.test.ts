import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { faker } from '@faker-js/faker';
import { AppModule } from '@/app.module';
import { createContainers, closeContainers } from '@test/helpers';
import request from 'supertest';

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
    await app?.close();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await closeContainers();
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
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(201);
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
      expect(response.body.message).toBeDefined();
      expect(/^Username .+ already exists/gim.test(response.body.message)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
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
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
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
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });
  });

  describe('GET /auth/check', () => {
    it('should return an error if query param "field" is not sent', async () => {
      const response = await request(app.getHttpServer()).get('/auth/check').query({ value: user.email }).send();

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('Field is required');
      expect(response.body.errors).toContain('Field must contain value "email" or "username"');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an error if query param "value" is not sent', async () => {
      const response = await request(app.getHttpServer()).get('/auth/check').query({ field: 'email' }).send();

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('Value is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an object with property "valid" with value "true" if informed email is already registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'email', value: user.email })
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();

      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.valid).toBe(true);

      expect(response.body.data.field).toBeDefined();
      expect(response.body.data.field).toBe('email');

      expect(response.body.data.value).toBeDefined();
      expect(response.body.data.value).toBe(user.email);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });

    it('should return an object with property "valid" with value "true" if informed username is already registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'username', value: user.username })
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();

      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.valid).toBe(true);

      expect(response.body.data.field).toBeDefined();
      expect(response.body.data.field).toBe('username');

      expect(response.body.data.value).toBeDefined();
      expect(response.body.data.value).toBe(user.username);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });

    it('should return an object with property "valid" with value "false" if informed email is not registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'email', value: 'email.not.registered@notregistered.com' })
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();

      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.valid).toBe(false);

      expect(response.body.data.field).toBeDefined();
      expect(response.body.data.field).toBe('email');

      expect(response.body.data.value).toBeDefined();
      expect(response.body.data.value).toBe(user.email);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });

    it('should return an object with property "valid" with value "false" if informed username is not registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'username', value: 'username.not.registered' })
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();

      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.valid).toBe(false);

      expect(response.body.data.field).toBeDefined();
      expect(response.body.data.field).toBe('username');

      expect(response.body.data.value).toBeDefined();
      expect(response.body.data.value).toBe(user.username);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });
  });
});
