import { AuthModule } from '@/auth/auth.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { App } from 'supertest/types';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import { execSync } from 'child_process';

describe('Authentication routes', () => {
  let app: INestApplication<App>;
  const user = {
    name: faker.person.fullName(),
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    bio: faker.lorem.paragraph(),
  };

  beforeAll(async () => {
    const container = await new PostgreSqlContainer().start();
    process.env.DATABASE_URL = container.getConnectionUri();
    execSync('pnpm db:migrate:deploy', { stdio: 'inherit' });
  }, 30000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should register a new user (without image)', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.token).toBeDefined();
  });
});
