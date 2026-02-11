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

describe('Inspection (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let rucheId: string;

    beforeAll(async () => {
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
        process.env.JWT_SECRET = 'test-jwt-secret-key-min-16-chars';
        process.env.JWT_ACCESS_EXPIRATION = '15m';
        process.env.JWT_REFRESH_EXPIRATION = '7d';

        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService).useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn() })
            .overrideProvider(USER_REPOSITORY).useValue(new MockUserRepository())
            .overrideProvider(REFRESH_TOKEN_REPOSITORY).useValue(new MockRefreshTokenRepository())
            .overrideProvider(RUCHER_REPOSITORY).useValue(new MockRucherRepository())
            .overrideProvider(RUCHE_REPOSITORY).useValue(new MockRucheRepository())
            .overrideProvider(INSPECTION_REPOSITORY).useValue(new MockInspectionRepository())
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

        // Register → create rucher → create ruche
        const authRes = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ email: 'inspection@test.com', password: 'Password123!', nom: 'Test', prenom: 'User' });
        accessToken = authRes.body.data.tokens.accessToken;

        const rucherRes = await request(app.getHttpServer())
            .post('/api/v1/ruchers')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nom: 'Rucher Inspections' });
        const rucherId = rucherRes.body.data.id;

        const rucheRes = await request(app.getHttpServer())
            .post(`/api/v1/ruchers/${rucherId}/ruches`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nom: 'Ruche Inspections' });
        rucheId = rucheRes.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/ruches/:rucheId/inspections', () => {
        it('should create an inspection', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ date: '2025-06-15', etatGeneral: 'BON', presenceReine: true, nombreCadres: 7 })
                .expect(201);

            expect(res.body.data.etatGeneral).toBe('BON');
            expect(res.body.data.rucheId).toBe(rucheId);
            expect(res.body.data.presenceReine).toBe(true);
        });

        it('should return 400 for missing required fields', async () => {
            await request(app.getHttpServer())
                .post(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({})
                .expect(400);
        });
    });

    describe('GET /api/v1/ruches/:rucheId/inspections', () => {
        it('should list inspections with pagination', async () => {
            await request(app.getHttpServer())
                .post(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ date: '2025-07-01', etatGeneral: 'EXCELLENT' });

            const res = await request(app.getHttpServer())
                .get(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.meta).toBeDefined();
            expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/v1/inspections/:id', () => {
        it('should get an inspection by id', async () => {
            const createRes = await request(app.getHttpServer())
                .post(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ date: '2025-08-01', etatGeneral: 'MOYEN' });

            const id = createRes.body.data.id;

            const res = await request(app.getHttpServer())
                .get(`/api/v1/inspections/${id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.data.etatGeneral).toBe('MOYEN');
        });
    });

    describe('PUT /api/v1/inspections/:id', () => {
        it('should update an inspection', async () => {
            const createRes = await request(app.getHttpServer())
                .post(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ date: '2025-09-01', etatGeneral: 'FAIBLE' });

            const id = createRes.body.data.id;

            const res = await request(app.getHttpServer())
                .put(`/api/v1/inspections/${id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ etatGeneral: 'BON', notes: 'Amélioration constatée' })
                .expect(200);

            expect(res.body.data.etatGeneral).toBe('BON');
        });
    });

    describe('DELETE /api/v1/inspections/:id', () => {
        it('should delete an inspection', async () => {
            const createRes = await request(app.getHttpServer())
                .post(`/api/v1/ruches/${rucheId}/inspections`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ date: '2025-10-01', etatGeneral: 'CRITIQUE' });

            const id = createRes.body.data.id;

            await request(app.getHttpServer())
                .delete(`/api/v1/inspections/${id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
        });
    });
});
