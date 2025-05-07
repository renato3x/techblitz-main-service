import { AppModule } from '@/app.module';
import { CommonModule } from '@/common/common.module';
import { PasswordService } from '@/common/services/password.service';
import { PrismaService } from '@/common/services/prisma.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { closeContainers, createContainers, createUser } from '@test/helpers';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { StartedTestContainer } from 'testcontainers';

describe('POST /auth/change-password', () => {
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

  it('should block change password if "old_password" is different from current password', async () => {
    const body = {
      old_password: faker.internet.password({ length: 20 }),
      new_password: faker.internet.password({ length: 10 }),
    };

    const response = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
      .send(body);

    expect(response.status).toBe(403);
    expect(response.body).toBeDefined();

    expect(response.body.error).toBeDefined();
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.message).toBe('Current password is incorrect');

    expect(response.body.timestamp).toBeDefined();
    expect(response.body.status_code).toBeDefined();
    expect(response.body.status_code).toBe(403);
  });

  it('should block change password if "new_password" is equals from current password', async () => {
    const body = {
      old_password: user.password,
      new_password: user.password,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
      .send(body);

    expect(response.status).toBe(403);
    expect(response.body).toBeDefined();

    expect(response.body.error).toBeDefined();
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.message).toBe('New password must be different from current password');

    expect(response.body.timestamp).toBeDefined();
    expect(response.body.status_code).toBeDefined();
    expect(response.body.status_code).toBe(403);
  });

  it('should change user password', async () => {
    const body = {
      old_password: user.password,
      new_password: faker.internet.password({ length: 10 }),
    };

    const response = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`)
      .send(body);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
});
