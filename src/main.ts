import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@interfaces/common/filters/http-exception.filter';
import { TransformInterceptor } from '@interfaces/common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global response transform interceptor
    app.useGlobalInterceptors(new TransformInterceptor());

    // Validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // CORS
    app.enableCors();

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('API Mellifera')
        .setDescription(
            'API REST de gestion apicole — Ruchers, Ruches, Inspections. ' +
            'Architecture Clean + DDD léger avec authentification JWT.',
        )
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Entrer le token JWT',
                in: 'header',
            },
            'access-token',
        )
        .addTag('Auth', 'Authentification et gestion des tokens')
        .addTag('Ruchers', 'Gestion des ruchers')
        .addTag('Ruches', 'Gestion des ruches')
        .addTag('Inspections', 'Gestion des inspections')
        .build();

    const documentFactory = (): ReturnType<typeof SwaggerModule.createDocument> =>
        SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`🐝 API Mellifera is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger UI available at: http://localhost:${port}/api`);
}

void bootstrap();
