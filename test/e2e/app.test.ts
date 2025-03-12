import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const container = await new PostgreSqlContainer().start();
    process.env.DATABASE_URL = container.getConnectionUri();
  }, 30000);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/');
    expect(response.body).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Hello World');
  });
});
