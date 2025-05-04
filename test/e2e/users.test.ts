import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { closeContainers, createContainers } from '@test/helpers';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import request from 'supertest';
import { faker } from '@faker-js/faker';

describe('Users endpoints', () => {
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
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await closeContainers();
  });

  describe('GET users/:username', () => {
    it('should return public user data by username', async () => {
      const { username } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user)
        .then((response) => response.body.data.user);
      const response = await request(app.getHttpServer()).get(`/users/${username}`).send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.username).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.data.total_followers).not.toBeNaN();
      expect(response.body.data.total_following).not.toBeNaN();
      expect(response.body.data).toHaveProperty('avatar_url');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).not.toHaveProperty('password');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });

    it('should return an error if user does not exists', async () => {
      const response = await request(app.getHttpServer()).get('/users/not_existent_user.083').send();

      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('User not found');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(404);
    });
  });
});
