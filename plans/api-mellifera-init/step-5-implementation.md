# Step 5 — Couche Infrastructure : Implémentation des Repositories Prisma

## Goal
Implémenter les 5 repositories concrets (`PrismaUserRepository`, `PrismaRefreshTokenRepository`, `PrismaRucherRepository`, `PrismaRucheRepository`, `PrismaInspectionRepository`) qui utilisent `PrismaService` pour persister/lire les données, avec mapping bidirectionnel Prisma ↔ Entités Domaine, pagination, tri, filtrage, et enregistrement dans `AppModule`.

## Prerequisites
Vérifier que l'on est sur la branche `feat/api-mellifera-init` avant de commencer.
Si ce n'est pas le cas, basculer sur cette branche. Si elle n'existe pas, la créer depuis `main`.

---

### Step-by-Step Instructions

#### Step 5.1 : Créer `PrismaUserRepository`

- [x] Créer le fichier `src/infrastructure/repositories/prisma-user.repository.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { Email } from '@domain/user/value-objects/email.vo';
import { Role } from '@domain/enums';
import type { User as PrismaUser } from '../../generated/prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<UserEntity | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) return null;

        return this.toDomain(user);
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) return null;

        return this.toDomain(user);
    }

    async create(userEntity: UserEntity): Promise<UserEntity> {
        const user = await this.prisma.user.create({
            data: {
                email: userEntity.email.toString(),
                password: userEntity.password,
                nom: userEntity.nom,
                prenom: userEntity.prenom,
                role: userEntity.role,
            },
        });

        return this.toDomain(user);
    }

    async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
        const updateData: Record<string, unknown> = {};

        if (data.email !== undefined) {
            updateData.email = data.email.toString();
        }
        if (data.password !== undefined) {
            updateData.password = data.password;
        }
        if (data.nom !== undefined) {
            updateData.nom = data.nom;
        }
        if (data.prenom !== undefined) {
            updateData.prenom = data.prenom;
        }
        if (data.role !== undefined) {
            updateData.role = data.role;
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });

        return this.toDomain(user);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }

    private toDomain(user: PrismaUser): UserEntity {
        return UserEntity.fromPersistence({
            id: user.id,
            email: Email.create(user.email),
            password: user.password,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role as Role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
}
```

---

#### Step 5.2 : Créer `PrismaRefreshTokenRepository`

- [x] Créer le fichier `src/infrastructure/repositories/prisma-refresh-token.repository.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { IRefreshTokenRepository } from '@domain/user/repositories/refresh-token.repository.interface';
import { RefreshTokenEntity } from '@domain/user/entities/refresh-token.entity';
import type { RefreshToken as PrismaRefreshToken } from '../../generated/prisma/client';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(entity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
        const refreshToken = await this.prisma.refreshToken.create({
            data: {
                token: entity.token,
                userId: entity.userId,
                expiresAt: entity.expiresAt,
            },
        });

        return this.toDomain(refreshToken);
    }

    async findByToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
        const refreshToken = await this.prisma.refreshToken.findUnique({
            where: { token: tokenHash },
        });

        if (!refreshToken) return null;

        return this.toDomain(refreshToken);
    }

    async revokeByToken(tokenHash: string): Promise<void> {
        await this.prisma.refreshToken.update({
            where: { token: tokenHash },
            data: { revokedAt: new Date() },
        });
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: { revokedAt: new Date() },
        });
    }

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });

        return result.count;
    }

    private toDomain(token: PrismaRefreshToken): RefreshTokenEntity {
        return RefreshTokenEntity.fromPersistence({
            id: token.id,
            token: token.token,
            userId: token.userId,
            expiresAt: token.expiresAt,
            revokedAt: token.revokedAt,
            createdAt: token.createdAt,
        });
    }
}
```

---

#### Step 5.3 : Créer `PrismaRucherRepository`

- [x] Créer le fichier `src/infrastructure/repositories/prisma-rucher.repository.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
    IRucherRepository,
    RucherFilters,
} from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';
import {
    PaginatedResult,
    PaginationParams,
    SortParams,
} from '@shared/types';
import type { Rucher as PrismaRucher } from '../../generated/prisma/client';

@Injectable()
export class PrismaRucherRepository implements IRucherRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<RucherEntity | null> {
        const rucher = await this.prisma.rucher.findUnique({
            where: { id },
        });

        if (!rucher) return null;

        return this.toDomain(rucher);
    }

    async findAllByUserId(
        userId: string,
        pagination: PaginationParams,
        sort?: SortParams,
        filters?: RucherFilters,
    ): Promise<PaginatedResult<RucherEntity>> {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { userId };

        if (filters?.search) {
            where.OR = [
                { nom: { contains: filters.search, mode: 'insensitive' } },
                { adresse: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const orderBy = sort
            ? { [sort.sortBy]: sort.sortOrder }
            : { createdAt: 'desc' as const };

        const [ruchers, total] = await Promise.all([
            this.prisma.rucher.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.rucher.count({ where }),
        ]);

        return {
            items: ruchers.map((r) => this.toDomain(r)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(entity: RucherEntity): Promise<RucherEntity> {
        const rucher = await this.prisma.rucher.create({
            data: {
                nom: entity.nom,
                adresse: entity.adresse,
                latitude: entity.coordonnees?.latitude ?? null,
                longitude: entity.coordonnees?.longitude ?? null,
                description: entity.description,
                userId: entity.userId,
            },
        });

        return this.toDomain(rucher);
    }

    async update(
        id: string,
        data: Partial<RucherEntity>,
    ): Promise<RucherEntity> {
        const updateData: Record<string, unknown> = {};

        if (data.nom !== undefined) {
            updateData.nom = data.nom;
        }
        if (data.adresse !== undefined) {
            updateData.adresse = data.adresse;
        }
        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if ('coordonnees' in data) {
            const coordonnees = (data as Record<string, unknown>).coordonnees as CoordonneesGps | null;
            if (coordonnees) {
                updateData.latitude = coordonnees.latitude;
                updateData.longitude = coordonnees.longitude;
            } else {
                updateData.latitude = null;
                updateData.longitude = null;
            }
        }

        const rucher = await this.prisma.rucher.update({
            where: { id },
            data: updateData,
        });

        return this.toDomain(rucher);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.rucher.delete({
            where: { id },
        });
    }

    private toDomain(rucher: PrismaRucher): RucherEntity {
        let coordonnees: CoordonneesGps | null = null;
        if (rucher.latitude !== null && rucher.longitude !== null) {
            coordonnees = CoordonneesGps.create(
                rucher.latitude,
                rucher.longitude,
            );
        }

        return RucherEntity.fromPersistence({
            id: rucher.id,
            nom: rucher.nom,
            adresse: rucher.adresse,
            coordonnees,
            description: rucher.description,
            userId: rucher.userId,
            createdAt: rucher.createdAt,
            updatedAt: rucher.updatedAt,
        });
    }
}
```

---

#### Step 5.4 : Créer `PrismaRucheRepository`

- [x] Créer le fichier `src/infrastructure/repositories/prisma-ruche.repository.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
    IRucheRepository,
    RucheFilters,
} from '@domain/ruche/repositories/ruche.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { TypeRuche, StatutRuche } from '@domain/enums';
import {
    PaginatedResult,
    PaginationParams,
    SortParams,
} from '@shared/types';
import type { Ruche as PrismaRuche } from '../../generated/prisma/client';

@Injectable()
export class PrismaRucheRepository implements IRucheRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<RucheEntity | null> {
        const ruche = await this.prisma.ruche.findUnique({
            where: { id },
        });

        if (!ruche) return null;

        return this.toDomain(ruche);
    }

    async findAllByRucherId(
        rucherId: string,
        pagination: PaginationParams,
        sort?: SortParams,
        filters?: RucheFilters,
    ): Promise<PaginatedResult<RucheEntity>> {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { rucherId };

        if (filters?.statut) {
            where.statut = filters.statut;
        }
        if (filters?.type) {
            where.type = filters.type;
        }

        const orderBy = sort
            ? { [sort.sortBy]: sort.sortOrder }
            : { createdAt: 'desc' as const };

        const [ruches, total] = await Promise.all([
            this.prisma.ruche.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.ruche.count({ where }),
        ]);

        return {
            items: ruches.map((r) => this.toDomain(r)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(entity: RucheEntity): Promise<RucheEntity> {
        const ruche = await this.prisma.ruche.create({
            data: {
                nom: entity.nom,
                type: entity.type,
                statut: entity.statut,
                dateAchat: entity.dateAchat,
                notes: entity.notes,
                rucherId: entity.rucherId,
            },
        });

        return this.toDomain(ruche);
    }

    async update(
        id: string,
        data: Partial<RucheEntity>,
    ): Promise<RucheEntity> {
        const updateData: Record<string, unknown> = {};

        if (data.nom !== undefined) {
            updateData.nom = data.nom;
        }
        if (data.type !== undefined) {
            updateData.type = data.type;
        }
        if (data.statut !== undefined) {
            updateData.statut = data.statut;
        }
        if (data.dateAchat !== undefined) {
            updateData.dateAchat = data.dateAchat;
        }
        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        const ruche = await this.prisma.ruche.update({
            where: { id },
            data: updateData,
        });

        return this.toDomain(ruche);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.ruche.delete({
            where: { id },
        });
    }

    private toDomain(ruche: PrismaRuche): RucheEntity {
        return RucheEntity.fromPersistence({
            id: ruche.id,
            nom: ruche.nom,
            type: ruche.type as TypeRuche,
            statut: ruche.statut as StatutRuche,
            dateAchat: ruche.dateAchat,
            notes: ruche.notes,
            rucherId: ruche.rucherId,
            createdAt: ruche.createdAt,
            updatedAt: ruche.updatedAt,
        });
    }
}
```

---

#### Step 5.5 : Créer `PrismaInspectionRepository`

- [x] Créer le fichier `src/infrastructure/repositories/prisma-inspection.repository.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
    IInspectionRepository,
    InspectionFilters,
} from '@domain/inspection/repositories/inspection.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';
import {
    PaginatedResult,
    PaginationParams,
    SortParams,
} from '@shared/types';
import type { Inspection as PrismaInspection } from '../../generated/prisma/client';

@Injectable()
export class PrismaInspectionRepository implements IInspectionRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<InspectionEntity | null> {
        const inspection = await this.prisma.inspection.findUnique({
            where: { id },
        });

        if (!inspection) return null;

        return this.toDomain(inspection);
    }

    async findAllByRucheId(
        rucheId: string,
        pagination: PaginationParams,
        sort?: SortParams,
        filters?: InspectionFilters,
    ): Promise<PaginatedResult<InspectionEntity>> {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { rucheId };

        if (filters?.etatGeneral) {
            where.etatGeneral = filters.etatGeneral;
        }

        if (filters?.dateFrom || filters?.dateTo) {
            const dateFilter: Record<string, Date> = {};
            if (filters.dateFrom) {
                dateFilter.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                dateFilter.lte = filters.dateTo;
            }
            where.date = dateFilter;
        }

        const orderBy = sort
            ? { [sort.sortBy]: sort.sortOrder }
            : { date: 'desc' as const };

        const [inspections, total] = await Promise.all([
            this.prisma.inspection.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.inspection.count({ where }),
        ]);

        return {
            items: inspections.map((i) => this.toDomain(i)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(entity: InspectionEntity): Promise<InspectionEntity> {
        const inspection = await this.prisma.inspection.create({
            data: {
                date: entity.date,
                etatGeneral: entity.etatGeneral,
                niveauReserve: entity.niveauReserve,
                comportement: entity.comportement,
                presenceReine: entity.presenceReine,
                nombreCadres: entity.nombreCadres,
                presenceMaladie: entity.presenceMaladie,
                descriptionMaladie: entity.descriptionMaladie,
                traitementApplique: entity.traitementApplique,
                recolteKg: entity.recolteKg,
                notes: entity.notes,
                rucheId: entity.rucheId,
            },
        });

        return this.toDomain(inspection);
    }

    async update(
        id: string,
        data: Partial<InspectionEntity>,
    ): Promise<InspectionEntity> {
        const updateData: Record<string, unknown> = {};

        if (data.date !== undefined) {
            updateData.date = data.date;
        }
        if (data.etatGeneral !== undefined) {
            updateData.etatGeneral = data.etatGeneral;
        }
        if (data.niveauReserve !== undefined) {
            updateData.niveauReserve = data.niveauReserve;
        }
        if (data.comportement !== undefined) {
            updateData.comportement = data.comportement;
        }
        if (data.presenceReine !== undefined) {
            updateData.presenceReine = data.presenceReine;
        }
        if (data.nombreCadres !== undefined) {
            updateData.nombreCadres = data.nombreCadres;
        }
        if (data.presenceMaladie !== undefined) {
            updateData.presenceMaladie = data.presenceMaladie;
        }
        if (data.descriptionMaladie !== undefined) {
            updateData.descriptionMaladie = data.descriptionMaladie;
        }
        if (data.traitementApplique !== undefined) {
            updateData.traitementApplique = data.traitementApplique;
        }
        if (data.recolteKg !== undefined) {
            updateData.recolteKg = data.recolteKg;
        }
        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        const inspection = await this.prisma.inspection.update({
            where: { id },
            data: updateData,
        });

        return this.toDomain(inspection);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.inspection.delete({
            where: { id },
        });
    }

    private toDomain(inspection: PrismaInspection): InspectionEntity {
        return InspectionEntity.fromPersistence({
            id: inspection.id,
            date: inspection.date,
            etatGeneral: inspection.etatGeneral as EtatGeneral,
            niveauReserve: (inspection.niveauReserve as NiveauReserve) ?? null,
            comportement: (inspection.comportement as Comportement) ?? null,
            presenceReine: inspection.presenceReine,
            nombreCadres: inspection.nombreCadres,
            presenceMaladie: inspection.presenceMaladie,
            descriptionMaladie: inspection.descriptionMaladie,
            traitementApplique: inspection.traitementApplique,
            recolteKg: inspection.recolteKg,
            notes: inspection.notes,
            rucheId: inspection.rucheId,
            createdAt: inspection.createdAt,
            updatedAt: inspection.updatedAt,
        });
    }
}
```

---

#### Step 5.6 : Créer le barrel export `src/infrastructure/repositories/index.ts`

- [x] Créer le fichier `src/infrastructure/repositories/index.ts` :

```typescript
export { PrismaUserRepository } from './prisma-user.repository';
export { PrismaRefreshTokenRepository } from './prisma-refresh-token.repository';
export { PrismaRucherRepository } from './prisma-rucher.repository';
export { PrismaRucheRepository } from './prisma-ruche.repository';
export { PrismaInspectionRepository } from './prisma-inspection.repository';
```

---

#### Step 5.7 : Mettre à jour `AppModule` pour enregistrer les repositories

- [x] Remplacer le contenu de `src/app.module.ts` par :

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

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
    imports: [AppConfigModule, PrismaModule, CqrsModule.forRoot()],
    controllers: [],
    providers: [
        ...RepositoryProviders,
        ...CommandHandlers,
        ...QueryHandlers,
    ],
})
export class AppModule {}
```

---

##### Step 5 Verification Checklist

- [x] Le répertoire `src/infrastructure/repositories/` contient 6 fichiers :
  - `prisma-user.repository.ts`
  - `prisma-refresh-token.repository.ts`
  - `prisma-rucher.repository.ts`
  - `prisma-ruche.repository.ts`
  - `prisma-inspection.repository.ts`
  - `index.ts`
 - [x] `src/app.module.ts` enregistre les 5 repository providers avec les tokens Symbol et tous les handlers CQRS.
 - [x] Exécuter `npm run build` — aucune erreur de compilation.
 - [x] Vérifier que chaque repository :
  - Implémente correctement l'interface correspondante
  - Mappe correctement Prisma → Entité Domaine via `fromPersistence()`
  - Gère le Value Object `Email` (toString/create) pour `UserRepository`
  - Gère le Value Object `CoordonneesGps` (latitude/longitude séparés ↔ VO) pour `RucherRepository`
  - Implémente la pagination avec `skip`/`take` + `count()` + `totalPages`
  - Implémente les filtres métier (search, statut, type, dateFrom/dateTo, etatGeneral)
  - Gère le tri avec fallback par défaut (`createdAt: desc` ou `date: desc`)

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
Commit suggéré : `feat: add Prisma repository implementations`
