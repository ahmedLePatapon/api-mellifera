import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { req } from '../helpers/supertest-helpers';
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

describe('Ruche (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let rucherId: string;

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
      .useValue(new MockUserRepository())
      .overrideProvider(REFRESH_TOKEN_REPOSITORY)
      .useValue(new MockRefreshTokenRepository())
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

    // Register and get token
    const authRes = (await req(app).post('/api/v1/auth/register').send({
      email: 'ruche@test.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User',
    })) as request.Response;
    accessToken = authRes.body.data.tokens.accessToken;

    // Create a rucher
    const rucherRes = await req(app)
      .post('/api/v1/ruchers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nom: 'Rucher pour ruches' });
    rucherId = rucherRes.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/ruchers/:rucherId/ruches', () => {
    it('should create a ruche', async () => {
      const res = (await req(app)
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Alpha', type: 'DADANT', statut: 'ACTIVE' })
        .expect(201)) as request.Response;

      expect(res.body.data.nom).toBe('Ruche Alpha');
      expect(res.body.data.type).toBe('DADANT');
      expect(res.body.data.rucherId).toBe(rucherId);
    });

    it('should return 404 for unknown rucher', async () => {
      await req(app)
        .post('/api/v1/ruchers/00000000-0000-0000-0000-000000000000/ruches')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Test' })
        .expect(404);
    });
  });

  describe('GET /api/v1/ruchers/:rucherId/ruches', () => {
    it('should list ruches with pagination', async () => {
      await req(app)
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Liste' });

      const res = (await req(app)
        .get(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)) as request.Response;

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/ruches/:id', () => {
    it('should get a ruche by id', async () => {
      const createRes = (await req(app)
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Detail' })) as request.Response;

      const id = createRes.body.data.id;

      const res = (await req(app)
        .get(`/api/v1/ruches/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)) as request.Response;

      expect(res.body.data.nom).toBe('Ruche Detail');
    });
  });

  describe('PUT /api/v1/ruches/:id', () => {
    it('should update a ruche', async () => {
      const createRes = (await req(app)
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ancien' })) as request.Response;

      const id = createRes.body.data.id;

      const res = (await req(app)
        .put(`/api/v1/ruches/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Nouveau', statut: 'INACTIVE' })
        .expect(200)) as request.Response;

      expect(res.body.data.nom).toBe('Nouveau');
    });
  });

  describe('DELETE /api/v1/ruches/:id', () => {
    it('should delete a ruche', async () => {
      const createRes = await req(app)
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'A Supprimer' });

      const id = createRes.body.data.id;

      await req(app)
        .delete(`/api/v1/ruches/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
