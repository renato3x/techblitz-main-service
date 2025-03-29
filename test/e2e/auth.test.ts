import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { App } from 'supertest/types';
import { faker } from '@faker-js/faker';
import { execSync } from 'child_process';
import { AppModule } from '@/app.module';
import request from 'supertest';

describe('Authentication routes', () => {
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

  it('POST /auth/register', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send(user);
    console.log(response.body);

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
});
