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

describe('Rucher (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  const mockUserRepo = new MockUserRepository();
  const mockRefreshTokenRepo = new MockRefreshTokenRepository();
  const mockRucherRepo = new MockRucherRepository();

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
      .useValue(mockRucherRepo)
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

    // Register and get access token
    const res = (await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: 'rucher@test.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User',
    })) as request.Response;
    accessToken = res.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/ruchers', () => {
    it('should create a rucher', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Rucher des Tilleuls', adresse: '12 chemin des Abeilles' })
        .expect(201);

      expect(res.body.data.nom).toBe('Rucher des Tilleuls');
      expect(res.body.data.adresse).toBe('12 chemin des Abeilles');
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).post('/api/v1/ruchers').send({ nom: 'Test' }).expect(401);
    });

    it('should return 400 for missing nom', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/ruchers', () => {
    it('should list ruchers with pagination meta', async () => {
      // Create a rucher first
      await request(app.getHttpServer())
        .post('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Rucher Liste' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/v1/ruchers/:id', () => {
    it('should get a rucher by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Rucher Detail' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/ruchers/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.nom).toBe('Rucher Detail');
    });

    it('should return 404 for unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ruchers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/ruchers/:id', () => {
    it('should update a rucher', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ancien Nom' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/v1/ruchers/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Nouveau Nom' })
        .expect(200);

      expect(res.body.data.nom).toBe('Nouveau Nom');
    });
  });

  describe('DELETE /api/v1/ruchers/:id', () => {
    it('should delete a rucher', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/ruchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'A Supprimer' });

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/ruchers/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/v1/ruchers/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
