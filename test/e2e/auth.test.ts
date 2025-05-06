import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { faker } from '@faker-js/faker';
import { AppModule } from '@/app.module';
import { createContainers, closeContainers } from '@test/helpers';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtTokenService } from '@/jwt-token/services/jwt-token.service';
import { JwtTokenType } from '@/jwt-token/enums/jwt-token-type.enum';
import { PrismaService } from '@/common/services/prisma.service';
import { CommonModule } from '@/common/common.module';

describe('Authentication endpoints', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtTokenService: JwtTokenService;
  let token: string = '';
  let existentUserToken: string = '';
  let existentUserId: string = '';
  let existentUserEmail: string = '';

  const user = {
    name: 'John Doe',
    username: 'john.doe',
    email: 'john.doe@helloworld.com',
    password: faker.internet.password({ length: 10 }),
  };

  const tokenPayload = {
    sub: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    username: faker.internet.username().toLowerCase(),
  };

  beforeAll(async () => {
    await createContainers();
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

    jwtTokenService = module.get(JwtTokenService);
    prisma = module.get(PrismaService);
    token = jwtTokenService.create(tokenPayload, JwtTokenType.APP).token;
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

  describe('POST /auth/register', () => {
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

      existentUserToken = authTokenCookie?.split(';')[0].split('=')[1] as string;
      existentUserId = response.body.data.user.id;
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

  describe('POST /auth/login', () => {
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

  describe('POST /auth/logout', () => {
    it('should logout user removing auth token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${token}`])
        .send();

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const authTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith(`${process.env.AUTH_TOKEN_COOKIE_NAME}=`),
      );

      expect(authTokenCookie).toBeDefined();
      expect(authTokenCookie).toContain('Expires=Thu, 01 Jan 1970');
    });
  });

  describe('GET /auth/user', () => {
    it('should logged user data if access token is valid', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/user')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${existentUserToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.username).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.role).toBeDefined();
      expect(response.body.data.role).toBe('USER');
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.data).toHaveProperty('avatar_url');
      expect(response.body.data).toHaveProperty('avatar_fallback');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).not.toHaveProperty('password');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });
  });

  describe('GET /auth/check', () => {
    it('should block request if query param "field" is not sent', async () => {
      const response = await request(app.getHttpServer()).get('/auth/check').query({ value: user.email }).send();

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"field" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should block request if query param "value" is not sent', async () => {
      const response = await request(app.getHttpServer()).get('/auth/check').query({ field: 'email' }).send();

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toContain('"value" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });

    it('should return an object with property "valid" with value "false" if informed email is already registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'email', value: user.email })
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

    it('should return an object with property "valid" with value "false" if informed username is already registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'username', value: user.username })
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

    it('should return an object with property "valid" with value "true" if informed email is not registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'email', value: 'email.not.registered@notregistered.com' })
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();

      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.valid).toBe(true);

      expect(response.body.data.field).toBeDefined();
      expect(response.body.data.field).toBe('email');

      expect(response.body.data.value).toBeDefined();
      expect(response.body.data.value).toBe('email.not.registered@notregistered.com');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });

    it('should return an object with property "valid" with value "true" if informed username is not registered', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'username', value: 'username.not.registered' })
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data).toBeDefined();

      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.valid).toBe(true);

      expect(response.body.data.field).toBeDefined();
      expect(response.body.data.field).toBe('username');

      expect(response.body.data.value).toBeDefined();
      expect(response.body.data.value).toBe('username.not.registered');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(200);
    });

    it('should block request if query param "field" is email and "value" is not a valid email', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .query({ field: 'email', value: 'thisisnotanemail' })
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('Bad Request');

      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Informed email is not valid');

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
      expect(response.body.status_code).toBe(400);
    });
  });

  describe('PATCH /auth/user', () => {
    it('should update data from signed in user', async () => {
      const data = {
        name: 'Doe John',
        username: 'doe_john_586',
        email: faker.internet.email().toLowerCase(),
        bio: faker.lorem.paragraph(1).substring(0, 100),
      };

      existentUserEmail = data.email;

      const response = await request(app.getHttpServer())
        .patch('/auth/user')
        .set('Cookie', [`${process.env.AUTH_TOKEN_COOKIE_NAME}=${existentUserToken}`])
        .send(data);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.username).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.role).toBeDefined();
      expect(response.body.data.role).toBe('USER');
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.data).toHaveProperty('avatar_url');
      expect(response.body.data).toHaveProperty('avatar_fallback');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).not.toHaveProperty('password');

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

  describe('POST /auth/change-password', () => {
    it('should block change password if "old_password" is different from current password', async () => {
      const body = {
        old_password: faker.internet.password({ length: 20 }),
        new_password: faker.internet.password({ length: 10 }),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${existentUserToken}`)
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
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${existentUserToken}`)
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
        .set('Cookie', `${process.env.AUTH_TOKEN_COOKIE_NAME}=${existentUserToken}`)
        .send(body);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should create a recovery token for a valid user email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: existentUserEmail });

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      expect(prisma.accountRecoveryToken).toBeDefined();

      const token = await prisma?.accountRecoveryToken?.findFirst({
        where: { user_id: existentUserId },
      });

      expect(token).toBeDefined();
      expect(token!.token).toBeDefined();
      expect(new Date(token!.expires_at).getTime()).toBeGreaterThan(Date.now());
    });

    it('should return an error if email is not registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User not found');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBe(404);
    });

    it('should return an error if email is not valid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email-format' });

      expect(response.status).toBe(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('"email" is required');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.status_code).toBeDefined();
    });
  });
});
