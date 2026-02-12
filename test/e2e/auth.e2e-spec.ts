import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
  USER_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  RUCHER_REPOSITORY,
  RUCHE_REPOSITORY,
  INSPECTION_REPOSITORY,
} from '@shared/constants';
import { HttpExceptionFilter } from '@interfaces/common/filters/http-exception.filter';
import { TransformInterceptor } from '@interfaces/common/interceptors/transform.interceptor';
import {
  MockUserRepository,
  MockRefreshTokenRepository,
  MockRucherRepository,
  MockRucheRepository,
  MockInspectionRepository,
} from '../helpers/mock-repositories';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const mockUserRepo = new MockUserRepository();
  const mockRefreshTokenRepo = new MockRefreshTokenRepository();

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-min-16-chars';
    process.env.JWT_ACCESS_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn() })
      .overrideProvider(USER_REPOSITORY)
      .useValue(mockUserRepo)
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(mockRefreshTokenRepo)
      .overrideProvider(RUCHER_REPOSITORY)
      .useValue(new MockRucherRepository())
      .overrideProvider(RUCHE_REPOSITORY)
      .useValue(new MockRucheRepository())
      .overrideProvider(INSPECTION_REPOSITORY)
      .useValue(new MockInspectionRepository())
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockUserRepo.reset();
    mockRefreshTokenRepo.reset();
  });

  const validUser = {
    email: 'apiculteur@test.com',
    password: 'Password123!',
    nom: 'Dupont',
    prenom: 'Jean',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = (await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201)) as request.Response;

      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.user.email).toBe('apiculteur@test.com');
      expect(res.body.data.user.nom).toBe('Dupont');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.statusCode).toBe(201);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(validUser).expect(201);

      const res = (await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(409)) as request.Response;

      expect(res.body.statusCode).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login and return tokens', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(validUser).expect(201);

      const res = (await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(200)) as request.Response;

      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(validUser).expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'wrong-password' })
        .expect(401);
    });

    it('should return 401 for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@test.com', password: 'Password123!' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      const registerRes = (await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201)) as request.Response;

      const refreshToken = registerRes.body.data.tokens.refreshToken;

      const res = (await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)) as request.Response;

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject an already-used refresh token (rotation)', async () => {
      const registerRes = (await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201)) as request.Response;

      const refreshToken = registerRes.body.data.tokens.refreshToken;

      // First refresh — should succeed
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Second refresh with same token — should fail (revoked)
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke the refresh token', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      const { accessToken, refreshToken } = registerRes.body.data.tokens;

      const res = (await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200)) as request.Response;

      expect(res.body.data.message).toBe('Logout successful');
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);
    });
  });
});
