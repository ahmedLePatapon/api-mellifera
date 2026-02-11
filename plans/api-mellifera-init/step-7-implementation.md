# Step 7 — Couche Interfaces : Contrôleurs REST, DTOs, Pagination & Filtrage

## Goal
Créer les contrôleurs REST complets pour Ruchers, Ruches et Inspections avec DTOs validés, pagination/filtrage sur les listes, un intercepteur de transformation des réponses, un filtre d'exceptions HTTP, et assembler le tout dans `AppModule`.

## Prerequisites
- Steps 1–6 complétées (NestJS init, Prisma schema, Domaine, Application CQRS, Repositories Prisma, Auth JWT)
- `npm run build` compile sans erreur
- Branche `feat/api-mellifera-init`

---

### Step-by-Step Instructions

---

#### Step 7.1 : Créer le DTO de pagination partagé

 - [x] Créer `src/interfaces/common/dto/pagination.dto.ts` :

```typescript
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
    /** Numéro de la page (commence à 1) */
    @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page: number = 1;

    /** Nombre d'éléments par page */
    @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    /** Champ de tri */
    @ApiPropertyOptional({ example: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    /** Ordre de tri */
    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
```

 - [x] Créer `src/interfaces/common/dto/index.ts` :

```typescript
export { PaginationQueryDto } from './pagination.dto';
```

 - [x] Mettre à jour `src/interfaces/common/index.ts` pour exporter les DTOs :

```typescript
export { CurrentUser, JwtPayload } from './decorators';
export { OwnershipGuard, SetResourceType, RESOURCE_TYPE_KEY } from './guards';
export type { ResourceType } from './guards';
export { PaginationQueryDto } from './dto';
```

##### Step 7.1 Verification Checklist
- [ ] `npm run build` compile sans erreur

#### Step 7.1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7.2 : Créer le `HttpExceptionFilter` et le `TransformInterceptor`

 - [x] Créer `src/interfaces/common/filters/http-exception.filter.ts` :

```typescript
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

export interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode: number;
        let message: string | string[];
        let error: string;

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exception.name;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse as Record<string, unknown>;
                message = (resp['message'] as string | string[]) ?? exception.message;
                error = (resp['error'] as string) ?? exception.name;
            } else {
                message = exception.message;
                error = exception.name;
            }
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';
            this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
        }

        const errorResponse: ErrorResponse = {
            statusCode,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(statusCode).json(errorResponse);
    }
}
```

 - [x] Créer `src/interfaces/common/filters/index.ts` :

```typescript
export { HttpExceptionFilter } from './http-exception.filter';
export type { ErrorResponse } from './http-exception.filter';
```

 - [x] Créer `src/interfaces/common/interceptors/transform.interceptor.ts` :

```typescript
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '@shared/types';

export interface ApiResponse<T> {
    data: T;
    statusCode: number;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'items' in value &&
        'total' in value &&
        'page' in value &&
        'limit' in value &&
        'totalPages' in value &&
        Array.isArray((value as PaginatedResult<unknown>).items)
    );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<ApiResponse<T>> {
        const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;

        return next.handle().pipe(
            map((data) => {
                if (isPaginatedResult(data)) {
                    return {
                        data: data.items as unknown as T,
                        statusCode,
                        meta: {
                            total: data.total,
                            page: data.page,
                            limit: data.limit,
                            totalPages: data.totalPages,
                        },
                    };
                }

                return {
                    data,
                    statusCode,
                };
            }),
        );
    }
}
```

 - [x] Créer `src/interfaces/common/interceptors/index.ts` :

```typescript
export { TransformInterceptor } from './transform.interceptor';
export type { ApiResponse } from './transform.interceptor';
```

 - [x] Mettre à jour `src/interfaces/common/index.ts` pour exporter les nouveaux éléments :
```typescript
export { CurrentUser, JwtPayload } from './decorators';
export { OwnershipGuard, SetResourceType, RESOURCE_TYPE_KEY } from './guards';
export type { ResourceType } from './guards';
export { PaginationQueryDto } from './dto';
export { HttpExceptionFilter } from './filters';
export type { ErrorResponse } from './filters';
export { TransformInterceptor } from './interceptors';
export type { ApiResponse } from './interceptors';
```

##### Step 7.2 Verification Checklist
- [ ] `npm run build` compile sans erreur

#### Step 7.2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7.3 : Enregistrer le filtre et l'intercepteur globalement dans `main.ts`

 - [x] Mettre à jour `src/main.ts` pour ajouter le filtre d'exception et l'intercepteur globalement :

```typescript
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
```

##### Step 7.3 Verification Checklist
- [ ] `npm run build` compile sans erreur

#### Step 7.3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7.4 : Créer les DTOs et le contrôleur Rucher

- [ ] Créer `src/interfaces/rucher/dto/create-rucher.dto.ts` :
 - [x] Créer `src/interfaces/rucher/dto/create-rucher.dto.ts` :

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    Max,
    MaxLength,
} from 'class-validator';

export class CreateRucherDto {
    /** Nom du rucher */
    @ApiProperty({ example: 'Rucher des Tilleuls', description: 'Nom du rucher' })
    @IsString()
    @IsNotEmpty({ message: 'Le nom du rucher est requis' })
    @MaxLength(200)
    nom!: string;

    /** Adresse du rucher */
    @ApiPropertyOptional({ example: '12 chemin des Abeilles, 31000 Toulouse' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    adresse?: string | null;

    /** Latitude GPS */
    @ApiPropertyOptional({ example: 43.6047, description: 'Latitude (-90 à 90)' })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number | null;

    /** Longitude GPS */
    @ApiPropertyOptional({ example: 1.4442, description: 'Longitude (-180 à 180)' })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number | null;

    /** Description du rucher */
    @ApiPropertyOptional({ example: 'Rucher principal en bordure de forêt' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;
}
```

 - [x] Créer `src/interfaces/rucher/dto/update-rucher.dto.ts` :

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
    Max,
    MaxLength,
} from 'class-validator';

export class UpdateRucherDto {
    /** Nom du rucher */
    @ApiPropertyOptional({ example: 'Rucher des Tilleuls' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    nom?: string;

    /** Adresse du rucher */
    @ApiPropertyOptional({ example: '12 chemin des Abeilles, 31000 Toulouse' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    adresse?: string | null;

    /** Latitude GPS */
    @ApiPropertyOptional({ example: 43.6047, description: 'Latitude (-90 à 90)' })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number | null;

    /** Longitude GPS */
    @ApiPropertyOptional({ example: 1.4442, description: 'Longitude (-180 à 180)' })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number | null;

    /** Description du rucher */
    @ApiPropertyOptional({ example: 'Rucher principal en bordure de forêt' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;
}
```

 - [x] Créer `src/interfaces/rucher/dto/index.ts` :

```typescript
export { CreateRucherDto } from './create-rucher.dto';
export { UpdateRucherDto } from './update-rucher.dto';
```

 - [x] Créer `src/interfaces/rucher/rucher.controller.ts` :

```typescript
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '@interfaces/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@interfaces/common/dto/pagination.dto';
import { CreateRucherDto } from './dto/create-rucher.dto';
import { UpdateRucherDto } from './dto/update-rucher.dto';
import {
    CreateRucherCommand,
    UpdateRucherCommand,
    DeleteRucherCommand,
    ListRuchersQuery,
    GetRucherQuery,
} from '@application/rucher';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { PaginatedResult } from '@shared/types';

@ApiTags('Ruchers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ruchers')
export class RucherController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Créer un nouveau rucher' })
    @ApiResponse({ status: 201, description: 'Rucher créé avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async create(
        @Body() dto: CreateRucherDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucherEntity> {
        return this.commandBus.execute(
            new CreateRucherCommand(
                dto.nom,
                userId,
                dto.adresse,
                dto.latitude,
                dto.longitude,
                dto.description,
            ),
        );
    }

    @Get()
    @ApiOperation({ summary: 'Lister ses ruchers avec pagination et recherche' })
    @ApiResponse({ status: 200, description: 'Liste paginée des ruchers' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
        @CurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
        @Query('search') search?: string,
    ): Promise<PaginatedResult<RucherEntity>> {
        const sort = pagination.sortBy
            ? { sortBy: pagination.sortBy, sortOrder: pagination.sortOrder ?? 'desc' as const }
            : undefined;

        const filters = search ? { search } : undefined;

        return this.queryBus.execute(
            new ListRuchersQuery(
                userId,
                { page: pagination.page, limit: pagination.limit },
                sort,
                filters,
            ),
        );
    }

    @Get(':id')
    @ApiOperation({ summary: "Récupérer un rucher par son ID" })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Rucher trouvé' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<RucherEntity> {
        return this.queryBus.execute(new GetRucherQuery(id, userId));
    }

    @Put(':id')
    @ApiOperation({ summary: 'Modifier un rucher' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Rucher modifié avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRucherDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucherEntity> {
        return this.commandBus.execute(
            new UpdateRucherCommand(
                id,
                userId,
                dto.nom,
                dto.adresse,
                dto.latitude,
                dto.longitude,
                dto.description,
            ),
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer un rucher' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Rucher supprimé avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        return this.commandBus.execute(new DeleteRucherCommand(id, userId));
    }
}
```

 - [x] Créer `src/interfaces/rucher/index.ts` :

```typescript
export { RucherController } from './rucher.controller';
export { CreateRucherDto } from './dto/create-rucher.dto';
export { UpdateRucherDto } from './dto/update-rucher.dto';
```

##### Step 7.4 Verification Checklist
- [ ] `npm run build` compile sans erreur

#### Step 7.4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7.5 : Créer les DTOs, filtres et le contrôleur Ruche

 - [x] Créer `src/interfaces/ruche/dto/create-ruche.dto.ts` :

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsDateString,
    MaxLength,
} from 'class-validator';
import { TypeRuche, StatutRuche } from '@domain/enums';

export class CreateRucheDto {
    /** Nom de la ruche */
    @ApiProperty({ example: 'Ruche Alpha', description: 'Nom de la ruche' })
    @IsString()
    @IsNotEmpty({ message: 'Le nom de la ruche est requis' })
    @MaxLength(200)
    nom!: string;

    /** Type de ruche */
    @ApiPropertyOptional({ enum: TypeRuche, example: TypeRuche.DADANT })
    @IsOptional()
    @IsEnum(TypeRuche, { message: 'Le type de ruche doit être une valeur valide' })
    type?: TypeRuche;

    /** Statut de la ruche */
    @ApiPropertyOptional({ enum: StatutRuche, example: StatutRuche.ACTIVE })
    @IsOptional()
    @IsEnum(StatutRuche, { message: 'Le statut de la ruche doit être une valeur valide' })
    statut?: StatutRuche;

    /** Date d'achat */
    @ApiPropertyOptional({ example: '2025-03-15', description: "Date d'achat (ISO 8601)" })
    @IsOptional()
    @IsDateString({}, { message: "La date d'achat doit être une date ISO 8601 valide" })
    dateAchat?: string | null;

    /** Notes */
    @ApiPropertyOptional({ example: 'Ruche achetée au printemps' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string | null;
}
```

 - [x] Créer `src/interfaces/ruche/dto/update-ruche.dto.ts` :

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    MaxLength,
} from 'class-validator';
import { TypeRuche, StatutRuche } from '@domain/enums';

export class UpdateRucheDto {
    /** Nom de la ruche */
    @ApiPropertyOptional({ example: 'Ruche Alpha' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    nom?: string;

    /** Type de ruche */
    @ApiPropertyOptional({ enum: TypeRuche, example: TypeRuche.DADANT })
    @IsOptional()
    @IsEnum(TypeRuche, { message: 'Le type de ruche doit être une valeur valide' })
    type?: TypeRuche;

    /** Statut de la ruche */
    @ApiPropertyOptional({ enum: StatutRuche, example: StatutRuche.ACTIVE })
    @IsOptional()
    @IsEnum(StatutRuche, { message: 'Le statut de la ruche doit être une valeur valide' })
    statut?: StatutRuche;

    /** Date d'achat */
    @ApiPropertyOptional({ example: '2025-03-15', description: "Date d'achat (ISO 8601)" })
    @IsOptional()
    @IsDateString({}, { message: "La date d'achat doit être une date ISO 8601 valide" })
    dateAchat?: string | null;

    /** Notes */
    @ApiPropertyOptional({ example: 'Ruche achetée au printemps' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string | null;
}
```

 - [x] Créer `src/interfaces/ruche/dto/filter-ruche.dto.ts` :

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { TypeRuche, StatutRuche } from '@domain/enums';

export class FilterRucheDto {
    /** Filtrer par statut de ruche */
    @ApiPropertyOptional({ enum: StatutRuche, example: StatutRuche.ACTIVE })
    @IsOptional()
    @IsEnum(StatutRuche, { message: 'Le statut doit être une valeur valide' })
    statut?: StatutRuche;

    /** Filtrer par type de ruche */
    @ApiPropertyOptional({ enum: TypeRuche, example: TypeRuche.DADANT })
    @IsOptional()
    @IsEnum(TypeRuche, { message: 'Le type doit être une valeur valide' })
    type?: TypeRuche;
}
```

 - [x] Créer `src/interfaces/ruche/dto/index.ts` :

```typescript
export { CreateRucheDto } from './create-ruche.dto';
export { UpdateRucheDto } from './update-ruche.dto';
export { FilterRucheDto } from './filter-ruche.dto';
```

 - [x] Créer `src/interfaces/ruche/ruche.controller.ts` :

```typescript
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '@interfaces/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@interfaces/common/dto/pagination.dto';
import { CreateRucheDto } from './dto/create-ruche.dto';
import { UpdateRucheDto } from './dto/update-ruche.dto';
import { FilterRucheDto } from './dto/filter-ruche.dto';
import {
    CreateRucheCommand,
    UpdateRucheCommand,
    DeleteRucheCommand,
    ListRuchesQuery,
    GetRucheQuery,
} from '@application/ruche';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { PaginatedResult } from '@shared/types';
import { RucheFilters } from '@domain/ruche/repositories/ruche.repository.interface';

@ApiTags('Ruches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class RucheController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post('ruchers/:rucherId/ruches')
    @ApiOperation({ summary: 'Créer une ruche dans un rucher' })
    @ApiParam({ name: 'rucherId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Ruche créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async create(
        @Param('rucherId', ParseUUIDPipe) rucherId: string,
        @Body() dto: CreateRucheDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucheEntity> {
        return this.commandBus.execute(
            new CreateRucheCommand(
                dto.nom,
                rucherId,
                userId,
                dto.type,
                dto.statut,
                dto.dateAchat ? new Date(dto.dateAchat) : undefined,
                dto.notes,
            ),
        );
    }

    @Get('ruchers/:rucherId/ruches')
    @ApiOperation({ summary: "Lister les ruches d'un rucher avec pagination et filtrage" })
    @ApiParam({ name: 'rucherId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Liste paginée des ruches' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
        @Param('rucherId', ParseUUIDPipe) rucherId: string,
        @CurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
        @Query() filters: FilterRucheDto,
    ): Promise<PaginatedResult<RucheEntity>> {
        const sort = pagination.sortBy
            ? { sortBy: pagination.sortBy, sortOrder: pagination.sortOrder ?? 'desc' as const }
            : undefined;

        const rucheFilters: RucheFilters = {};
        if (filters.statut) rucheFilters.statut = filters.statut;
        if (filters.type) rucheFilters.type = filters.type;

        return this.queryBus.execute(
            new ListRuchesQuery(
                rucherId,
                userId,
                { page: pagination.page, limit: pagination.limit },
                sort,
                Object.keys(rucheFilters).length > 0 ? rucheFilters : undefined,
            ),
        );
    }

    @Get('ruches/:id')
    @ApiOperation({ summary: "Récupérer une ruche par son ID" })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Ruche trouvée' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<RucheEntity> {
        return this.queryBus.execute(new GetRucheQuery(id, userId));
    }

    @Put('ruches/:id')
    @ApiOperation({ summary: 'Modifier une ruche' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Ruche modifiée avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRucheDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucheEntity> {
        return this.commandBus.execute(
            new UpdateRucheCommand(
                id,
                userId,
                dto.nom,
                dto.type,
                dto.statut,
                dto.dateAchat !== undefined
                    ? dto.dateAchat
                        ? new Date(dto.dateAchat)
                        : null
                    : undefined,
                dto.notes,
            ),
        );
    }

    @Delete('ruches/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une ruche' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Ruche supprimée avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        return this.commandBus.execute(new DeleteRucheCommand(id, userId));
    }
}
```

 - [x] Créer `src/interfaces/ruche/index.ts` :

```typescript
export { RucheController } from './ruche.controller';
export { CreateRucheDto } from './dto/create-ruche.dto';
export { UpdateRucheDto } from './dto/update-ruche.dto';
export { FilterRucheDto } from './dto/filter-ruche.dto';
```

##### Step 7.5 Verification Checklist
- [ ] `npm run build` compile sans erreur

#### Step 7.5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7.6 : Créer les DTOs, filtres et le contrôleur Inspection

 - [x] Créer `src/interfaces/inspection/dto/create-inspection.dto.ts` :

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsDateString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsString,
    Min,
    MaxLength,
} from 'class-validator';
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class CreateInspectionDto {
    /** Date de l'inspection */
    @ApiProperty({ example: '2025-06-15', description: "Date de l'inspection (ISO 8601)" })
    @IsDateString({}, { message: "La date doit être une date ISO 8601 valide" })
    @IsNotEmpty({ message: "La date de l'inspection est requise" })
    date!: string;

    /** État général de la colonie */
    @ApiProperty({ enum: EtatGeneral, example: EtatGeneral.BON })
    @IsEnum(EtatGeneral, { message: "L'état général doit être une valeur valide" })
    @IsNotEmpty({ message: "L'état général est requis" })
    etatGeneral!: EtatGeneral;

    /** Niveau des réserves */
    @ApiPropertyOptional({ enum: NiveauReserve, example: NiveauReserve.SUFFISANT })
    @IsOptional()
    @IsEnum(NiveauReserve, { message: 'Le niveau de réserve doit être une valeur valide' })
    niveauReserve?: NiveauReserve | null;

    /** Comportement des abeilles */
    @ApiPropertyOptional({ enum: Comportement, example: Comportement.CALME })
    @IsOptional()
    @IsEnum(Comportement, { message: 'Le comportement doit être une valeur valide' })
    comportement?: Comportement | null;

    /** Présence de la reine */
    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    presenceReine?: boolean | null;

    /** Nombre de cadres de couvain */
    @ApiPropertyOptional({ example: 7, minimum: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Le nombre de cadres ne peut pas être négatif' })
    nombreCadres?: number | null;

    /** Présence de maladie */
    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    presenceMaladie?: boolean | null;

    /** Description de la maladie */
    @ApiPropertyOptional({ example: 'Varroa détecté' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    descriptionMaladie?: string | null;

    /** Traitement appliqué */
    @ApiPropertyOptional({ example: 'Traitement à l\'acide oxalique' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    traitementApplique?: string | null;

    /** Récolte en kg */
    @ApiPropertyOptional({ example: 12.5, minimum: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'La récolte ne peut pas être négative' })
    recolteKg?: number | null;

    /** Notes libres */
    @ApiPropertyOptional({ example: 'Colony vigoureuse, bonne activité au trou de vol' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notes?: string | null;
}
```

 - [x] Créer `src/interfaces/inspection/dto/update-inspection.dto.ts` :

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsString,
    Min,
    MaxLength,
} from 'class-validator';
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class UpdateInspectionDto {
    /** Date de l'inspection */
    @ApiPropertyOptional({ example: '2025-06-15', description: "Date de l'inspection (ISO 8601)" })
    @IsOptional()
    @IsDateString({}, { message: "La date doit être une date ISO 8601 valide" })
    date?: string;

    /** État général de la colonie */
    @ApiPropertyOptional({ enum: EtatGeneral, example: EtatGeneral.BON })
    @IsOptional()
    @IsEnum(EtatGeneral, { message: "L'état général doit être une valeur valide" })
    etatGeneral?: EtatGeneral;

    /** Niveau des réserves */
    @ApiPropertyOptional({ enum: NiveauReserve, example: NiveauReserve.SUFFISANT })
    @IsOptional()
    @IsEnum(NiveauReserve, { message: 'Le niveau de réserve doit être une valeur valide' })
    niveauReserve?: NiveauReserve | null;

    /** Comportement des abeilles */
    @ApiPropertyOptional({ enum: Comportement, example: Comportement.CALME })
    @IsOptional()
    @IsEnum(Comportement, { message: 'Le comportement doit être une valeur valide' })
    comportement?: Comportement | null;

    /** Présence de la reine */
    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    presenceReine?: boolean | null;

    /** Nombre de cadres de couvain */
    @ApiPropertyOptional({ example: 7, minimum: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Le nombre de cadres ne peut pas être négatif' })
    nombreCadres?: number | null;

    /** Présence de maladie */
    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    presenceMaladie?: boolean | null;

    /** Description de la maladie */
    @ApiPropertyOptional({ example: 'Varroa détecté' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    descriptionMaladie?: string | null;

    /** Traitement appliqué */
    @ApiPropertyOptional({ example: 'Traitement à l\'acide oxalique' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    traitementApplique?: string | null;

    /** Récolte en kg */
    @ApiPropertyOptional({ example: 12.5, minimum: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'La récolte ne peut pas être négative' })
    recolteKg?: number | null;

    /** Notes libres */
    @ApiPropertyOptional({ example: 'Colony vigoureuse, bonne activité au trou de vol' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notes?: string | null;
}
```

 - [x] Créer `src/interfaces/inspection/dto/filter-inspection.dto.ts` :

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { EtatGeneral } from '@domain/enums';

export class FilterInspectionDto {
    /** Filtrer à partir de cette date */
    @ApiPropertyOptional({ example: '2025-01-01', description: 'Date de début (ISO 8601)' })
    @IsOptional()
    @IsDateString({}, { message: 'dateFrom doit être une date ISO 8601 valide' })
    dateFrom?: string;

    /** Filtrer jusqu'à cette date */
    @ApiPropertyOptional({ example: '2025-12-31', description: 'Date de fin (ISO 8601)' })
    @IsOptional()
    @IsDateString({}, { message: 'dateTo doit être une date ISO 8601 valide' })
    dateTo?: string;

    /** Filtrer par état général */
    @ApiPropertyOptional({ enum: EtatGeneral, example: EtatGeneral.BON })
    @IsOptional()
    @IsEnum(EtatGeneral, { message: "L'état général doit être une valeur valide" })
    etatGeneral?: EtatGeneral;
}
```

 - [x] Créer `src/interfaces/inspection/dto/index.ts` :

```typescript
export { CreateInspectionDto } from './create-inspection.dto';
export { UpdateInspectionDto } from './update-inspection.dto';
export { FilterInspectionDto } from './filter-inspection.dto';
```

 - [x] Créer `src/interfaces/inspection/inspection.controller.ts` :

```typescript
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '@interfaces/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@interfaces/common/dto/pagination.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { FilterInspectionDto } from './dto/filter-inspection.dto';
import {
    CreateInspectionCommand,
    UpdateInspectionCommand,
    DeleteInspectionCommand,
    ListInspectionsQuery,
    GetInspectionQuery,
} from '@application/inspection';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { PaginatedResult } from '@shared/types';
import { InspectionFilters } from '@domain/inspection/repositories/inspection.repository.interface';

@ApiTags('Inspections')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class InspectionController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post('ruches/:rucheId/inspections')
    @ApiOperation({ summary: "Créer une inspection pour une ruche" })
    @ApiParam({ name: 'rucheId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Inspection créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async create(
        @Param('rucheId', ParseUUIDPipe) rucheId: string,
        @Body() dto: CreateInspectionDto,
        @CurrentUser('sub') userId: string,
    ): Promise<InspectionEntity> {
        return this.commandBus.execute(
            new CreateInspectionCommand(
                new Date(dto.date),
                dto.etatGeneral,
                rucheId,
                userId,
                dto.niveauReserve,
                dto.comportement,
                dto.presenceReine,
                dto.nombreCadres,
                dto.presenceMaladie,
                dto.descriptionMaladie,
                dto.traitementApplique,
                dto.recolteKg,
                dto.notes,
            ),
        );
    }

    @Get('ruches/:rucheId/inspections')
    @ApiOperation({ summary: "Lister les inspections d'une ruche avec pagination et filtrage" })
    @ApiParam({ name: 'rucheId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Liste paginée des inspections' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
        @Param('rucheId', ParseUUIDPipe) rucheId: string,
        @CurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
        @Query() filterDto: FilterInspectionDto,
    ): Promise<PaginatedResult<InspectionEntity>> {
        const sort = pagination.sortBy
            ? { sortBy: pagination.sortBy, sortOrder: pagination.sortOrder ?? 'desc' as const }
            : undefined;

        const filters: InspectionFilters = {};
        if (filterDto.dateFrom) filters.dateFrom = new Date(filterDto.dateFrom);
        if (filterDto.dateTo) filters.dateTo = new Date(filterDto.dateTo);
        if (filterDto.etatGeneral) filters.etatGeneral = filterDto.etatGeneral;

        return this.queryBus.execute(
            new ListInspectionsQuery(
                rucheId,
                userId,
                { page: pagination.page, limit: pagination.limit },
                sort,
                Object.keys(filters).length > 0 ? filters : undefined,
            ),
        );
    }

    @Get('inspections/:id')
    @ApiOperation({ summary: "Récupérer une inspection par son ID" })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Inspection trouvée' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Inspection non trouvée' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<InspectionEntity> {
        return this.queryBus.execute(new GetInspectionQuery(id, userId));
    }

    @Put('inspections/:id')
    @ApiOperation({ summary: 'Modifier une inspection' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Inspection modifiée avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Inspection non trouvée' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateInspectionDto,
        @CurrentUser('sub') userId: string,
    ): Promise<InspectionEntity> {
        return this.commandBus.execute(
            new UpdateInspectionCommand(
                id,
                userId,
                dto.date ? new Date(dto.date) : undefined,
                dto.etatGeneral,
                dto.niveauReserve,
                dto.comportement,
                dto.presenceReine,
                dto.nombreCadres,
                dto.presenceMaladie,
                dto.descriptionMaladie,
                dto.traitementApplique,
                dto.recolteKg,
                dto.notes,
            ),
        );
    }

    @Delete('inspections/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une inspection' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Inspection supprimée avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Inspection non trouvée' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        return this.commandBus.execute(new DeleteInspectionCommand(id, userId));
    }
}
```

 - [x] Créer `src/interfaces/inspection/index.ts` :

```typescript
export { InspectionController } from './inspection.controller';
export { CreateInspectionDto } from './dto/create-inspection.dto';
export { UpdateInspectionDto } from './dto/update-inspection.dto';
export { FilterInspectionDto } from './dto/filter-inspection.dto';
```

##### Step 7.6 Verification Checklist
- [ ] `npm run build` compile sans erreur

#### Step 7.6 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7.7 : Mettre à jour `AppModule` pour enregistrer les nouveaux contrôleurs

 - [x] Mettre à jour `src/app.module.ts` avec le contenu complet suivant :

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { AuthController } from './interfaces/auth/auth.controller';
import { RucherController } from './interfaces/rucher/rucher.controller';
import { RucheController } from './interfaces/ruche/ruche.controller';
import { InspectionController } from './interfaces/inspection/inspection.controller';

import {
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    RUCHER_REPOSITORY,
    RUCHE_REPOSITORY,
    INSPECTION_REPOSITORY,
} from './shared/constants';

import {
    PrismaUserRepository,
    PrismaRefreshTokenRepository,
    PrismaRucherRepository,
    PrismaRucheRepository,
    PrismaInspectionRepository,
} from './infrastructure/repositories';

import {
    RegisterUserHandler,
    GetUserHandler,
    CreateRucherHandler,
    UpdateRucherHandler,
    DeleteRucherHandler,
    ListRuchersHandler,
    GetRucherHandler,
    CreateRucheHandler,
    UpdateRucheHandler,
    DeleteRucheHandler,
    ListRuchesHandler,
    GetRucheHandler,
    CreateInspectionHandler,
    UpdateInspectionHandler,
    DeleteInspectionHandler,
    ListInspectionsHandler,
    GetInspectionHandler,
} from './application';

const CommandHandlers = [
    RegisterUserHandler,
    CreateRucherHandler,
    UpdateRucherHandler,
    DeleteRucherHandler,
    CreateRucheHandler,
    UpdateRucheHandler,
    DeleteRucheHandler,
    CreateInspectionHandler,
    UpdateInspectionHandler,
    DeleteInspectionHandler,
];

const QueryHandlers = [
    GetUserHandler,
    ListRuchersHandler,
    GetRucherHandler,
    ListRuchesHandler,
    GetRucheHandler,
    ListInspectionsHandler,
    GetInspectionHandler,
];

const RepositoryProviders = [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: RUCHER_REPOSITORY, useClass: PrismaRucherRepository },
    { provide: RUCHE_REPOSITORY, useClass: PrismaRucheRepository },
    { provide: INSPECTION_REPOSITORY, useClass: PrismaInspectionRepository },
];

@Module({
    imports: [AppConfigModule, PrismaModule, CqrsModule.forRoot(), AuthModule],
    controllers: [AuthController, RucherController, RucheController, InspectionController],
    providers: [...RepositoryProviders, ...CommandHandlers, ...QueryHandlers],
})
export class AppModule { }
```

##### Step 7.7 Verification Checklist
- [ ] `npm run build` compile sans erreur
- [ ] `npm run start:dev` démarre le serveur sans erreur
- [ ] Accéder à `http://localhost:3000/api` — Swagger UI affiche les tags Auth, Ruchers, Ruches, Inspections avec tous les endpoints documentés
- [ ] Vérifier que chaque endpoint apparaît avec ses paramètres de pagination/filtrage dans Swagger

#### Step 7.7 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

## Résumé des fichiers créés/modifiés

### Fichiers créés (18) :
| Fichier | Description |
|---------|-------------|
| `src/interfaces/common/dto/pagination.dto.ts` | DTO partagé de pagination (page, limit, sortBy, sortOrder) |
| `src/interfaces/common/dto/index.ts` | Barrel export DTOs communs |
| `src/interfaces/common/filters/http-exception.filter.ts` | Filtre d'exceptions HTTP uniforme |
| `src/interfaces/common/filters/index.ts` | Barrel export filtres |
| `src/interfaces/common/interceptors/transform.interceptor.ts` | Intercepteur de transformation des réponses |
| `src/interfaces/common/interceptors/index.ts` | Barrel export intercepteurs |
| `src/interfaces/rucher/dto/create-rucher.dto.ts` | DTO création rucher |
| `src/interfaces/rucher/dto/update-rucher.dto.ts` | DTO mise à jour rucher |
| `src/interfaces/rucher/dto/index.ts` | Barrel export DTOs rucher |
| `src/interfaces/rucher/rucher.controller.ts` | Contrôleur REST rucher (CRUD + pagination) |
| `src/interfaces/rucher/index.ts` | Barrel export rucher |
| `src/interfaces/ruche/dto/create-ruche.dto.ts` | DTO création ruche |
| `src/interfaces/ruche/dto/update-ruche.dto.ts` | DTO mise à jour ruche |
| `src/interfaces/ruche/dto/filter-ruche.dto.ts` | DTO filtres ruche (statut, type) |
| `src/interfaces/ruche/dto/index.ts` | Barrel export DTOs ruche |
| `src/interfaces/ruche/ruche.controller.ts` | Contrôleur REST ruche (CRUD + pagination + filtrage) |
| `src/interfaces/ruche/index.ts` | Barrel export ruche |
| `src/interfaces/inspection/dto/create-inspection.dto.ts` | DTO création inspection |
| `src/interfaces/inspection/dto/update-inspection.dto.ts` | DTO mise à jour inspection |
| `src/interfaces/inspection/dto/filter-inspection.dto.ts` | DTO filtres inspection (dateFrom, dateTo, etatGeneral) |
| `src/interfaces/inspection/dto/index.ts` | Barrel export DTOs inspection |
| `src/interfaces/inspection/inspection.controller.ts` | Contrôleur REST inspection (CRUD + pagination + filtrage) |
| `src/interfaces/inspection/index.ts` | Barrel export inspection |

### Fichiers modifiés (3) :
| Fichier | Modification |
|---------|-------------|
| `src/interfaces/common/index.ts` | Ajout exports DTOs, filtres, intercepteurs |
| `src/main.ts` | Ajout `HttpExceptionFilter` et `TransformInterceptor` globaux |
| `src/app.module.ts` | Ajout `RucherController`, `RucheController`, `InspectionController` |

### Endpoints REST créés :
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/v1/ruchers` | Créer un rucher |
| `GET` | `/api/v1/ruchers?page&limit&search&sortBy&sortOrder` | Lister ses ruchers |
| `GET` | `/api/v1/ruchers/:id` | Détail d'un rucher |
| `PUT` | `/api/v1/ruchers/:id` | Modifier un rucher |
| `DELETE` | `/api/v1/ruchers/:id` | Supprimer un rucher |
| `POST` | `/api/v1/ruchers/:rucherId/ruches` | Créer une ruche |
| `GET` | `/api/v1/ruchers/:rucherId/ruches?page&limit&statut&type&sortBy&sortOrder` | Lister les ruches d'un rucher |
| `GET` | `/api/v1/ruches/:id` | Détail d'une ruche |
| `PUT` | `/api/v1/ruches/:id` | Modifier une ruche |
| `DELETE` | `/api/v1/ruches/:id` | Supprimer une ruche |
| `POST` | `/api/v1/ruches/:rucheId/inspections` | Créer une inspection |
| `GET` | `/api/v1/ruches/:rucheId/inspections?page&limit&dateFrom&dateTo&etatGeneral&sortBy&sortOrder` | Lister les inspections |
| `GET` | `/api/v1/inspections/:id` | Détail d'une inspection |
| `PUT` | `/api/v1/inspections/:id` | Modifier une inspection |
| `DELETE` | `/api/v1/inspections/:id` | Supprimer une inspection |
