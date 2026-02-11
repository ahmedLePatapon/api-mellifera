# Step 4 : Couche Application — Use Cases (Commands & Queries CQRS)

## Goal
Implémenter tous les use cases de l'application via le pattern CQRS (`@nestjs/cqrs`) : commandes (création, modification, suppression) et queries (lecture unitaire, liste paginée/filtrée) pour User, Rucher, Ruche et Inspection, avec vérification d'ownership et hashage bcrypt pour l'inscription.

## Prerequisites
Vérifiez que vous êtes sur la branche `feat/api-mellifera-init`.
Si non, basculez dessus. Si elle n'existe pas, créez-la depuis `main`.

Les Steps 1-3 doivent être complétées (projet NestJS initialisé, schéma Prisma, couche domaine).

---

### Step-by-Step Instructions

---

#### Step 4.1 : Use Cases User — RegisterUser Command & GetUser Query

- [ ] Créer `src/application/user/commands/register-user.command.ts` :

```typescript
import { Role } from '@domain/enums';

export class RegisterUserCommand {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly nom: string,
        public readonly prenom: string,
        public readonly role?: Role,
    ) {}
}
```

- [ ] Créer `src/application/user/commands/register-user.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterUserCommand } from './register-user.command';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { USER_REPOSITORY } from '@shared/constants';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
    implements ICommandHandler<RegisterUserCommand>
{
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: RegisterUserCommand): Promise<UserEntity> {
        const existingUser = await this.userRepository.findByEmail(
            command.email,
        );
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(command.password, 12);

        const user = UserEntity.create({
            email: command.email,
            password: hashedPassword,
            nom: command.nom,
            prenom: command.prenom,
            role: command.role,
        });

        return this.userRepository.create(user);
    }
}
```

- [ ] Créer `src/application/user/queries/get-user.query.ts` :

```typescript
export class GetUserQuery {
    constructor(public readonly userId: string) {}
}
```

- [ ] Créer `src/application/user/queries/get-user.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { USER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: GetUserQuery): Promise<UserEntity> {
        const user = await this.userRepository.findById(query.userId);
        if (!user) {
            throw new NotFoundException(`User with id ${query.userId} not found`);
        }
        return user;
    }
}
```

- [ ] Créer `src/application/user/index.ts` :

```typescript
export { RegisterUserCommand } from './commands/register-user.command';
export { RegisterUserHandler } from './commands/register-user.handler';
export { GetUserQuery } from './queries/get-user.query';
export { GetUserHandler } from './queries/get-user.handler';
```

##### Step 4.1 Verification Checklist
- [ ] Aucune erreur TypeScript dans les 4 fichiers créés
- [ ] Les imports résolvent correctement via les path aliases (`@domain/*`, `@shared/*`)

#### Step 4.1 STOP & COMMIT
 - [x] Créer `src/application/user/commands/register-user.command.ts` :

```typescript
import { Role } from '@domain/enums';

export class RegisterUserCommand {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly nom: string,
        public readonly prenom: string,
        public readonly role?: Role,
    ) {}
}
```

 - [x] Créer `src/application/user/commands/register-user.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterUserCommand } from './register-user.command';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { USER_REPOSITORY } from '@shared/constants';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
    implements ICommandHandler<RegisterUserCommand>
{
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: RegisterUserCommand): Promise<UserEntity> {
        const existingUser = await this.userRepository.findByEmail(
            command.email,
        );
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(command.password, 12);

        const user = UserEntity.create({
            email: command.email,
            password: hashedPassword,
            nom: command.nom,
            prenom: command.prenom,
            role: command.role,
        });

        return this.userRepository.create(user);
    }
}
```

 - [x] Créer `src/application/user/queries/get-user.query.ts` :

```typescript
export class GetUserQuery {
    constructor(public readonly userId: string) {}
}
```

 - [x] Créer `src/application/user/queries/get-user.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { USER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: GetUserQuery): Promise<UserEntity> {
        const user = await this.userRepository.findById(query.userId);
        if (!user) {
            throw new NotFoundException(`User with id ${query.userId} not found`);
        }
        return user;
    }
}
```

 - [x] Créer `src/application/user/index.ts` :

```typescript
export { RegisterUserCommand } from './commands/register-user.command';
export { RegisterUserHandler } from './commands/register-user.handler';
export { GetUserQuery } from './queries/get-user.query';
export { GetUserHandler } from './queries/get-user.handler';
```

##### Step 4.1 Verification Checklist
 - [x] Aucune erreur TypeScript dans les 4 fichiers créés
 - [x] Les imports résolvent correctement via les path aliases (`@domain/*`, `@shared/*`)

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4.2 : Use Cases Rucher — Commands (Create, Update, Delete) & Queries (List, Get)

- [ ] Créer `src/application/rucher/commands/create-rucher.command.ts` :

```typescript
export class CreateRucherCommand {
    constructor(
        public readonly nom: string,
        public readonly userId: string,
        public readonly adresse?: string | null,
        public readonly latitude?: number | null,
        public readonly longitude?: number | null,
        public readonly description?: string | null,
    ) {}
}
```

- [ ] Créer `src/application/rucher/commands/create-rucher.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateRucherCommand } from './create-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateRucherCommand)
export class CreateRucherHandler
    implements ICommandHandler<CreateRucherCommand>
{
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: CreateRucherCommand): Promise<RucherEntity> {
        const rucher = RucherEntity.create({
            nom: command.nom,
            adresse: command.adresse,
            latitude: command.latitude,
            longitude: command.longitude,
            description: command.description,
            userId: command.userId,
        });

        return this.rucherRepository.create(rucher);
    }
}
```

- [ ] Créer `src/application/rucher/commands/update-rucher.command.ts` :

```typescript
export class UpdateRucherCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly nom?: string,
        public readonly adresse?: string | null,
        public readonly latitude?: number | null,
        public readonly longitude?: number | null,
        public readonly description?: string | null,
    ) {}
}
```

- [ ] Créer `src/application/rucher/commands/update-rucher.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateRucherCommand } from './update-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateRucherCommand)
export class UpdateRucherHandler
    implements ICommandHandler<UpdateRucherCommand>
{
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: UpdateRucherCommand): Promise<RucherEntity> {
        const rucher = await this.rucherRepository.findById(command.id);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.id} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this rucher',
            );
        }

        const updateData: Partial<RucherEntity> = {};

        if (command.nom !== undefined) {
            if (!command.nom || command.nom.trim().length === 0) {
                throw new Error('Rucher nom cannot be empty');
            }
            (updateData as Record<string, unknown>).nom = command.nom.trim();
        }

        if (command.adresse !== undefined) {
            (updateData as Record<string, unknown>).adresse =
                command.adresse?.trim() ?? null;
        }

        if (command.description !== undefined) {
            (updateData as Record<string, unknown>).description =
                command.description?.trim() ?? null;
        }

        if (
            command.latitude !== undefined &&
            command.longitude !== undefined
        ) {
            if (command.latitude !== null && command.longitude !== null) {
                (updateData as Record<string, unknown>).coordonnees =
                    CoordonneesGps.create(command.latitude, command.longitude);
            } else {
                (updateData as Record<string, unknown>).coordonnees = null;
            }
        }

        return this.rucherRepository.update(command.id, updateData);
    }
}
```

- [ ] Créer `src/application/rucher/commands/delete-rucher.command.ts` :

```typescript
export class DeleteRucherCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

- [ ] Créer `src/application/rucher/commands/delete-rucher.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRucherCommand } from './delete-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(DeleteRucherCommand)
export class DeleteRucherHandler
    implements ICommandHandler<DeleteRucherCommand>
{
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: DeleteRucherCommand): Promise<void> {
        const rucher = await this.rucherRepository.findById(command.id);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.id} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this rucher',
            );
        }

        await this.rucherRepository.delete(command.id);
    }
}
```

- [ ] Créer `src/application/rucher/queries/list-ruchers.query.ts` :

```typescript
import { PaginationParams, SortParams } from '@shared/types';
import { RucherFilters } from '@domain/rucher/repositories/rucher.repository.interface';

export class ListRuchersQuery {
    constructor(
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: RucherFilters,
    ) {}
}
```

- [ ] Créer `src/application/rucher/queries/list-ruchers.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRuchersQuery } from './list-ruchers.query';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { PaginatedResult } from '@shared/types';
import { RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListRuchersQuery)
export class ListRuchersHandler implements IQueryHandler<ListRuchersQuery> {
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        query: ListRuchersQuery,
    ): Promise<PaginatedResult<RucherEntity>> {
        return this.rucherRepository.findAllByUserId(
            query.userId,
            query.pagination,
            query.sort,
            query.filters,
        );
    }
}
```

- [ ] Créer `src/application/rucher/queries/get-rucher.query.ts` :

```typescript
export class GetRucherQuery {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

- [ ] Créer `src/application/rucher/queries/get-rucher.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRucherQuery } from './get-rucher.query';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetRucherQuery)
export class GetRucherHandler implements IQueryHandler<GetRucherQuery> {
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(query: GetRucherQuery): Promise<RucherEntity> {
        const rucher = await this.rucherRepository.findById(query.id);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${query.id} not found`,
            );
        }

        if (rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access this rucher',
            );
        }

        return rucher;
    }
}
```

- [ ] Créer `src/application/rucher/index.ts` :

 - [x] Créer `src/application/rucher/commands/create-rucher.command.ts` :

```typescript
export class CreateRucherCommand {
    constructor(
        public readonly nom: string,
        public readonly userId: string,
        public readonly adresse?: string | null,
        public readonly latitude?: number | null,
        public readonly longitude?: number | null,
        public readonly description?: string | null,
    ) {}
}
```

 - [x] Créer `src/application/rucher/commands/create-rucher.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateRucherCommand } from './create-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateRucherCommand)
export class CreateRucherHandler
    implements ICommandHandler<CreateRucherCommand>
{
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: CreateRucherCommand): Promise<RucherEntity> {
        const rucher = RucherEntity.create({
            nom: command.nom,
            adresse: command.adresse,
            latitude: command.latitude,
            longitude: command.longitude,
            description: command.description,
            userId: command.userId,
        });

        return this.rucherRepository.create(rucher);
    }
}
```

 - [x] Créer `src/application/rucher/commands/update-rucher.command.ts` :

```typescript
export class UpdateRucherCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly nom?: string,
        public readonly adresse?: string | null,
        public readonly latitude?: number | null,
        public readonly longitude?: number | null,
        public readonly description?: string | null,
    ) {}
}
```

 - [x] Créer `src/application/rucher/commands/update-rucher.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateRucherCommand } from './update-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateRucherCommand)
export class UpdateRucherHandler
    implements ICommandHandler<UpdateRucherCommand>
{
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: UpdateRucherCommand): Promise<RucherEntity> {
        const rucher = await this.rucherRepository.findById(command.id);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.id} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this rucher',
            );
        }

        const updateData: Partial<RucherEntity> = {};

        if (command.nom !== undefined) {
            if (!command.nom || command.nom.trim().length === 0) {
                throw new Error('Rucher nom cannot be empty');
            }
            (updateData as Record<string, unknown>).nom = command.nom.trim();
        }

        if (command.adresse !== undefined) {
            (updateData as Record<string, unknown>).adresse =
                command.adresse?.trim() ?? null;
        }

        if (command.description !== undefined) {
            (updateData as Record<string, unknown>).description =
                command.description?.trim() ?? null;
        }

        if (
            command.latitude !== undefined &&
            command.longitude !== undefined
        ) {
            if (command.latitude !== null && command.longitude !== null) {
                (updateData as Record<string, unknown>).coordonnees =
                    CoordonneesGps.create(command.latitude, command.longitude);
            } else {
                (updateData as Record<string, unknown>).coordonnees = null;
            }
        }

        return this.rucherRepository.update(command.id, updateData);
    }
}
```

 - [x] Créer `src/application/rucher/commands/delete-rucher.command.ts` :

```typescript
export class DeleteRucherCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

 - [x] Créer `src/application/rucher/commands/delete-rucher.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRucherCommand } from './delete-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(DeleteRucherCommand)
export class DeleteRucherHandler
    implements ICommandHandler<DeleteRucherCommand>
{
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: DeleteRucherCommand): Promise<void> {
        const rucher = await this.rucherRepository.findById(command.id);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.id} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this rucher',
            );
        }

        await this.rucherRepository.delete(command.id);
    }
}
```

 - [x] Créer `src/application/rucher/queries/list-ruchers.query.ts` :

```typescript
import { PaginationParams, SortParams } from '@shared/types';
import { RucherFilters } from '@domain/rucher/repositories/rucher.repository.interface';

export class ListRuchersQuery {
    constructor(
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: RucherFilters,
    ) {}
}
```

 - [x] Créer `src/application/rucher/queries/list-ruchers.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRuchersQuery } from './list-ruchers.query';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { PaginatedResult } from '@shared/types';
import { RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListRuchersQuery)
export class ListRuchersHandler implements IQueryHandler<ListRuchersQuery> {
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        query: ListRuchersQuery,
    ): Promise<PaginatedResult<RucherEntity>> {
        return this.rucherRepository.findAllByUserId(
            query.userId,
            query.pagination,
            query.sort,
            query.filters,
        );
    }
}
```

 - [x] Créer `src/application/rucher/queries/get-rucher.query.ts` :

```typescript
export class GetRucherQuery {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

 - [x] Créer `src/application/rucher/queries/get-rucher.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRucherQuery } from './get-rucher.query';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetRucherQuery)
export class GetRucherHandler implements IQueryHandler<GetRucherQuery> {
    constructor(
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(query: GetRucherQuery): Promise<RucherEntity> {
        const rucher = await this.rucherRepository.findById(query.id);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${query.id} not found`,
            );
        }

        if (rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access this rucher',
            );
        }

        return rucher;
    }
}
```

 - [x] Créer `src/application/rucher/index.ts` :

```typescript
export { CreateRucherCommand } from './commands/create-rucher.command';
export { CreateRucherHandler } from './commands/create-rucher.handler';
export { UpdateRucherCommand } from './commands/update-rucher.command';
export { UpdateRucherHandler } from './commands/update-rucher.handler';
export { DeleteRucherCommand } from './commands/delete-rucher.command';
export { DeleteRucherHandler } from './commands/delete-rucher.handler';
export { ListRuchersQuery } from './queries/list-ruchers.query';
export { ListRuchersHandler } from './queries/list-ruchers.handler';
export { GetRucherQuery } from './queries/get-rucher.query';
export { GetRucherHandler } from './queries/get-rucher.handler';
```

##### Step 4.2 Verification Checklist
 - [x] Aucune erreur TypeScript dans les 11 fichiers créés
 - [x] Les imports entre fichiers rucher résolvent correctement
 - [x] Les vérifications d'ownership sont présentes dans Update, Delete et Get

#### Step 4.2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

```typescript
export { CreateRucherCommand } from './commands/create-rucher.command';
export { CreateRucherHandler } from './commands/create-rucher.handler';
export { UpdateRucherCommand } from './commands/update-rucher.command';
export { UpdateRucherHandler } from './commands/update-rucher.handler';
export { DeleteRucherCommand } from './commands/delete-rucher.command';
export { DeleteRucherHandler } from './commands/delete-rucher.handler';
export { ListRuchersQuery } from './queries/list-ruchers.query';
export { ListRuchersHandler } from './queries/list-ruchers.handler';
export { GetRucherQuery } from './queries/get-rucher.query';
export { GetRucherHandler } from './queries/get-rucher.handler';
```

##### Step 4.2 Verification Checklist
- [ ] Aucune erreur TypeScript dans les 11 fichiers créés
- [ ] Les imports entre fichiers rucher résolvent correctement
- [ ] Les vérifications d'ownership sont présentes dans Update, Delete et Get

#### Step 4.2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4.3 : Use Cases Ruche — Commands (Create, Update, Delete) & Queries (List, Get)

- [ ] Créer `src/application/ruche/commands/create-ruche.command.ts` :

```typescript
import { TypeRuche, StatutRuche } from '@domain/enums';

export class CreateRucheCommand {
    constructor(
        public readonly nom: string,
        public readonly rucherId: string,
        public readonly userId: string,
        public readonly type?: TypeRuche,
        public readonly statut?: StatutRuche,
        public readonly dateAchat?: Date | null,
        public readonly notes?: string | null,
    ) {}
}
```

- [ ] Créer `src/application/ruche/commands/create-ruche.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateRucheCommand } from './create-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateRucheCommand)
export class CreateRucheHandler
    implements ICommandHandler<CreateRucheCommand>
{
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: CreateRucheCommand): Promise<RucheEntity> {
        const rucher = await this.rucherRepository.findById(command.rucherId);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.rucherId} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to add a ruche to this rucher',
            );
        }

        const ruche = RucheEntity.create({
            nom: command.nom,
            type: command.type,
            statut: command.statut,
            dateAchat: command.dateAchat,
            notes: command.notes,
            rucherId: command.rucherId,
        });

        return this.rucheRepository.create(ruche);
    }
}
```

- [ ] Créer `src/application/ruche/commands/update-ruche.command.ts` :

```typescript
import { TypeRuche, StatutRuche } from '@domain/enums';

export class UpdateRucheCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly nom?: string,
        public readonly type?: TypeRuche,
        public readonly statut?: StatutRuche,
        public readonly dateAchat?: Date | null,
        public readonly notes?: string | null,
    ) {}
}
```

- [ ] Créer `src/application/ruche/commands/update-ruche.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateRucheCommand } from './update-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateRucheCommand)
export class UpdateRucheHandler
    implements ICommandHandler<UpdateRucheCommand>
{
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: UpdateRucheCommand): Promise<RucheEntity> {
        const ruche = await this.rucheRepository.findById(command.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this ruche',
            );
        }

        const updateData: Partial<RucheEntity> = {};

        if (command.nom !== undefined) {
            if (!command.nom || command.nom.trim().length === 0) {
                throw new Error('Ruche nom cannot be empty');
            }
            (updateData as Record<string, unknown>).nom = command.nom.trim();
        }

        if (command.type !== undefined) {
            (updateData as Record<string, unknown>).type = command.type;
        }

        if (command.statut !== undefined) {
            (updateData as Record<string, unknown>).statut = command.statut;
        }

        if (command.dateAchat !== undefined) {
            (updateData as Record<string, unknown>).dateAchat =
                command.dateAchat ?? null;
        }

        if (command.notes !== undefined) {
            (updateData as Record<string, unknown>).notes =
                command.notes?.trim() ?? null;
        }

        return this.rucheRepository.update(command.id, updateData);
    }
}
```

- [ ] Créer `src/application/ruche/commands/delete-ruche.command.ts` :

```typescript
export class DeleteRucheCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

- [ ] Créer `src/application/ruche/commands/delete-ruche.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRucheCommand } from './delete-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(DeleteRucheCommand)
export class DeleteRucheHandler
    implements ICommandHandler<DeleteRucheCommand>
{
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: DeleteRucheCommand): Promise<void> {
        const ruche = await this.rucheRepository.findById(command.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this ruche',
            );
        }

        await this.rucheRepository.delete(command.id);
    }
}
```

- [ ] Créer `src/application/ruche/queries/list-ruches.query.ts` :

```typescript
import { PaginationParams, SortParams } from '@shared/types';
import { RucheFilters } from '@domain/ruche/repositories/ruche.repository.interface';

export class ListRuchesQuery {
    constructor(
        public readonly rucherId: string,
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: RucheFilters,
    ) {}
}
```

- [ ] Créer `src/application/ruche/queries/list-ruches.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListRuchesQuery } from './list-ruches.query';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { PaginatedResult } from '@shared/types';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListRuchesQuery)
export class ListRuchesHandler implements IQueryHandler<ListRuchesQuery> {
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        query: ListRuchesQuery,
    ): Promise<PaginatedResult<RucheEntity>> {
        const rucher = await this.rucherRepository.findById(query.rucherId);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${query.rucherId} not found`,
            );
        }

        if (rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access ruches of this rucher',
            );
        }

        return this.rucheRepository.findAllByRucherId(
            query.rucherId,
            query.pagination,
            query.sort,
            query.filters,
        );
    }
}
```

- [ ] Créer `src/application/ruche/queries/get-ruche.query.ts` :

```typescript
export class GetRucheQuery {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

- [ ] Créer `src/application/ruche/queries/get-ruche.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRucheQuery } from './get-ruche.query';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetRucheQuery)
export class GetRucheHandler implements IQueryHandler<GetRucheQuery> {
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(query: GetRucheQuery): Promise<RucheEntity> {
        const ruche = await this.rucheRepository.findById(query.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${query.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access this ruche',
            );
        }

        return ruche;
    }
}
```

- [ ] Créer `src/application/ruche/index.ts` :

 - [x] Créer `src/application/ruche/commands/create-ruche.command.ts` :

```typescript
import { TypeRuche, StatutRuche } from '@domain/enums';

export class CreateRucheCommand {
    constructor(
        public readonly nom: string,
        public readonly rucherId: string,
        public readonly userId: string,
        public readonly type?: TypeRuche,
        public readonly statut?: StatutRuche,
        public readonly dateAchat?: Date | null,
        public readonly notes?: string | null,
    ) {}
}
```

 - [x] Créer `src/application/ruche/commands/create-ruche.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateRucheCommand } from './create-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateRucheCommand)
export class CreateRucheHandler
    implements ICommandHandler<CreateRucheCommand>
{
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: CreateRucheCommand): Promise<RucheEntity> {
        const rucher = await this.rucherRepository.findById(command.rucherId);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.rucherId} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to add a ruche to this rucher',
            );
        }

        const ruche = RucheEntity.create({
            nom: command.nom,
            type: command.type,
            statut: command.statut,
            dateAchat: command.dateAchat,
            notes: command.notes,
            rucherId: command.rucherId,
        });

        return this.rucheRepository.create(ruche);
    }
}
```

 - [x] Créer `src/application/ruche/commands/update-ruche.command.ts` :

```typescript
import { TypeRuche, StatutRuche } from '@domain/enums';

export class UpdateRucheCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly nom?: string,
        public readonly type?: TypeRuche,
        public readonly statut?: StatutRuche,
        public readonly dateAchat?: Date | null,
        public readonly notes?: string | null,
    ) {}
}
```

 - [x] Créer `src/application/ruche/commands/update-ruche.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateRucheCommand } from './update-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateRucheCommand)
export class UpdateRucheHandler
    implements ICommandHandler<UpdateRucheCommand>
{
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: UpdateRucheCommand): Promise<RucheEntity> {
        const ruche = await this.rucheRepository.findById(command.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this ruche',
            );
        }

        const updateData: Partial<RucheEntity> = {};

        if (command.nom !== undefined) {
            if (!command.nom || command.nom.trim().length === 0) {
                throw new Error('Ruche nom cannot be empty');
            }
            (updateData as Record<string, unknown>).nom = command.nom.trim();
        }

        if (command.type !== undefined) {
            (updateData as Record<string, unknown>).type = command.type;
        }

        if (command.statut !== undefined) {
            (updateData as Record<string, unknown>).statut = command.statut;
        }

        if (command.dateAchat !== undefined) {
            (updateData as Record<string, unknown>).dateAchat =
                command.dateAchat ?? null;
        }

        if (command.notes !== undefined) {
            (updateData as Record<string, unknown>).notes =
                command.notes?.trim() ?? null;
        }

        return this.rucheRepository.update(command.id, updateData);
    }
}
```

 - [x] Créer `src/application/ruche/commands/delete-ruche.command.ts` :

```typescript
export class DeleteRucheCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

 - [x] Créer `src/application/ruche/commands/delete-ruche.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRucheCommand } from './delete-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(DeleteRucheCommand)
export class DeleteRucheHandler
    implements ICommandHandler<DeleteRucheCommand>
{
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: DeleteRucheCommand): Promise<void> {
        const ruche = await this.rucheRepository.findById(command.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this ruche',
            );
        }

        await this.rucheRepository.delete(command.id);
    }
}
```

 - [x] Créer `src/application/ruche/queries/list-ruches.query.ts` :

```typescript
import { PaginationParams, SortParams } from '@shared/types';
import { RucheFilters } from '@domain/ruche/repositories/ruche.repository.interface';

export class ListRuchesQuery {
    constructor(
        public readonly rucherId: string,
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: RucheFilters,
    ) {}
}
```

 - [x] Créer `src/application/ruche/queries/list-ruches.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListRuchesQuery } from './list-ruches.query';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { PaginatedResult } from '@shared/types';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListRuchesQuery)
export class ListRuchesHandler implements IQueryHandler<ListRuchesQuery> {
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        query: ListRuchesQuery,
    ): Promise<PaginatedResult<RucheEntity>> {
        const rucher = await this.rucherRepository.findById(query.rucherId);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${query.rucherId} not found`,
            );
        }

        if (rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access ruches of this rucher',
            );
        }

        return this.rucheRepository.findAllByRucherId(
            query.rucherId,
            query.pagination,
            query.sort,
            query.filters,
        );
    }
}
```

 - [x] Créer `src/application/ruche/queries/get-ruche.query.ts` :

```typescript
export class GetRucheQuery {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

 - [x] Créer `src/application/ruche/queries/get-ruche.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRucheQuery } from './get-ruche.query';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetRucheQuery)
export class GetRucheHandler implements IQueryHandler<GetRucheQuery> {
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(query: GetRucheQuery): Promise<RucheEntity> {
        const ruche = await this.rucheRepository.findById(query.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${query.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access this ruche',
            );
        }

        return ruche;
    }
}
```

 - [x] Créer `src/application/ruche/index.ts` :

```typescript
export { CreateRucheCommand } from './commands/create-ruche.command';
export { CreateRucheHandler } from './commands/create-ruche.handler';
export { UpdateRucheCommand } from './commands/update-ruche.command';
export { UpdateRucheHandler } from './commands/update-ruche.handler';
export { DeleteRucheCommand } from './commands/delete-ruche.command';
export { DeleteRucheHandler } from './commands/delete-ruche.handler';
export { ListRuchesQuery } from './queries/list-ruches.query';
export { ListRuchesHandler } from './queries/list-ruches.handler';
export { GetRucheQuery } from './queries/get-ruche.query';
export { GetRucheHandler } from './queries/get-ruche.handler';
```

##### Step 4.3 Verification Checklist
 - [x] Aucune erreur TypeScript dans les 11 fichiers créés
 - [x] Les handlers Ruche injectent bien `IRucherRepository` pour vérifier l'ownership via le rucher parent
 - [x] La vérification d'ownership est présente dans tous les handlers (Create, Update, Delete, List, Get)

#### Step 4.3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

```typescript
export { CreateRucheCommand } from './commands/create-ruche.command';
export { CreateRucheHandler } from './commands/create-ruche.handler';
export { UpdateRucheCommand } from './commands/update-ruche.command';
export { UpdateRucheHandler } from './commands/update-ruche.handler';
export { DeleteRucheCommand } from './commands/delete-ruche.command';
export { DeleteRucheHandler } from './commands/delete-ruche.handler';
export { ListRuchesQuery } from './queries/list-ruches.query';
export { ListRuchesHandler } from './queries/list-ruches.handler';
export { GetRucheQuery } from './queries/get-ruche.query';
export { GetRucheHandler } from './queries/get-ruche.handler';
```

##### Step 4.3 Verification Checklist
- [ ] Aucune erreur TypeScript dans les 11 fichiers créés
- [ ] Les handlers Ruche injectent bien `IRucherRepository` pour vérifier l'ownership via le rucher parent
- [ ] La vérification d'ownership est présente dans tous les handlers (Create, Update, Delete, List, Get)

#### Step 4.3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4.4 : Use Cases Inspection — Commands (Create, Update, Delete) & Queries (List, Get)

- [ ] Créer `src/application/inspection/commands/create-inspection.command.ts` :

```typescript
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class CreateInspectionCommand {
    constructor(
        public readonly date: Date,
        public readonly etatGeneral: EtatGeneral,
        public readonly rucheId: string,
        public readonly userId: string,
        public readonly niveauReserve?: NiveauReserve | null,
        public readonly comportement?: Comportement | null,
        public readonly presenceReine?: boolean | null,
        public readonly nombreCadres?: number | null,
        public readonly presenceMaladie?: boolean | null,
        public readonly descriptionMaladie?: string | null,
        public readonly traitementApplique?: string | null,
        public readonly recolteKg?: number | null,
        public readonly notes?: string | null,
    ) {}
}
```

- [ ] Créer `src/application/inspection/commands/create-inspection.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInspectionCommand } from './create-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(CreateInspectionCommand)
export class CreateInspectionHandler
    implements ICommandHandler<CreateInspectionCommand>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        command: CreateInspectionCommand,
    ): Promise<InspectionEntity> {
        const ruche = await this.rucheRepository.findById(command.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to add an inspection to this ruche',
            );
        }

        const inspection = InspectionEntity.create({
            date: command.date,
            etatGeneral: command.etatGeneral,
            niveauReserve: command.niveauReserve,
            comportement: command.comportement,
            presenceReine: command.presenceReine,
            nombreCadres: command.nombreCadres,
            presenceMaladie: command.presenceMaladie,
            descriptionMaladie: command.descriptionMaladie,
            traitementApplique: command.traitementApplique,
            recolteKg: command.recolteKg,
            notes: command.notes,
            rucheId: command.rucheId,
        });

        return this.inspectionRepository.create(inspection);
    }
}
```

- [ ] Créer `src/application/inspection/commands/update-inspection.command.ts` :

```typescript
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class UpdateInspectionCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly date?: Date,
        public readonly etatGeneral?: EtatGeneral,
        public readonly niveauReserve?: NiveauReserve | null,
        public readonly comportement?: Comportement | null,
        public readonly presenceReine?: boolean | null,
        public readonly nombreCadres?: number | null,
        public readonly presenceMaladie?: boolean | null,
        public readonly descriptionMaladie?: string | null,
        public readonly traitementApplique?: string | null,
        public readonly recolteKg?: number | null,
        public readonly notes?: string | null,
    ) {}
}
```

- [ ] Créer `src/application/inspection/commands/update-inspection.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateInspectionCommand } from './update-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(UpdateInspectionCommand)
export class UpdateInspectionHandler
    implements ICommandHandler<UpdateInspectionCommand>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        command: UpdateInspectionCommand,
    ): Promise<InspectionEntity> {
        const inspection = await this.inspectionRepository.findById(
            command.id,
        );
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${command.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this inspection',
            );
        }

        const updateData: Partial<InspectionEntity> = {};

        if (command.date !== undefined) {
            (updateData as Record<string, unknown>).date = command.date;
        }

        if (command.etatGeneral !== undefined) {
            (updateData as Record<string, unknown>).etatGeneral =
                command.etatGeneral;
        }

        if (command.niveauReserve !== undefined) {
            (updateData as Record<string, unknown>).niveauReserve =
                command.niveauReserve ?? null;
        }

        if (command.comportement !== undefined) {
            (updateData as Record<string, unknown>).comportement =
                command.comportement ?? null;
        }

        if (command.presenceReine !== undefined) {
            (updateData as Record<string, unknown>).presenceReine =
                command.presenceReine ?? null;
        }

        if (command.nombreCadres !== undefined) {
            if (
                command.nombreCadres !== null &&
                command.nombreCadres !== undefined &&
                command.nombreCadres < 0
            ) {
                throw new Error('Inspection nombreCadres cannot be negative');
            }
            (updateData as Record<string, unknown>).nombreCadres =
                command.nombreCadres ?? null;
        }

        if (command.presenceMaladie !== undefined) {
            (updateData as Record<string, unknown>).presenceMaladie =
                command.presenceMaladie ?? null;
        }

        if (command.descriptionMaladie !== undefined) {
            (updateData as Record<string, unknown>).descriptionMaladie =
                command.descriptionMaladie?.trim() ?? null;
        }

        if (command.traitementApplique !== undefined) {
            (updateData as Record<string, unknown>).traitementApplique =
                command.traitementApplique?.trim() ?? null;
        }

        if (command.recolteKg !== undefined) {
            if (
                command.recolteKg !== null &&
                command.recolteKg !== undefined &&
                command.recolteKg < 0
            ) {
                throw new Error('Inspection recolteKg cannot be negative');
            }
            (updateData as Record<string, unknown>).recolteKg =
                command.recolteKg ?? null;
        }

        if (command.notes !== undefined) {
            (updateData as Record<string, unknown>).notes =
                command.notes?.trim() ?? null;
        }

        return this.inspectionRepository.update(command.id, updateData);
    }
}
```

- [ ] Créer `src/application/inspection/commands/delete-inspection.command.ts` :

```typescript
export class DeleteInspectionCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

- [ ] Créer `src/application/inspection/commands/delete-inspection.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteInspectionCommand } from './delete-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(DeleteInspectionCommand)
export class DeleteInspectionHandler
    implements ICommandHandler<DeleteInspectionCommand>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: DeleteInspectionCommand): Promise<void> {
        const inspection = await this.inspectionRepository.findById(
            command.id,
        );
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${command.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this inspection',
            );
        }

        await this.inspectionRepository.delete(command.id);
    }
}
```

- [ ] Créer `src/application/inspection/queries/list-inspections.query.ts` :

```typescript
import { PaginationParams, SortParams } from '@shared/types';
import { InspectionFilters } from '@domain/inspection/repositories/inspection.repository.interface';

export class ListInspectionsQuery {
    constructor(
        public readonly rucheId: string,
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: InspectionFilters,
    ) {}
}
```

- [ ] Créer `src/application/inspection/queries/list-inspections.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListInspectionsQuery } from './list-inspections.query';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { PaginatedResult } from '@shared/types';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@QueryHandler(ListInspectionsQuery)
export class ListInspectionsHandler
    implements IQueryHandler<ListInspectionsQuery>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        query: ListInspectionsQuery,
    ): Promise<PaginatedResult<InspectionEntity>> {
        const ruche = await this.rucheRepository.findById(query.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${query.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access inspections of this ruche',
            );
        }

        return this.inspectionRepository.findAllByRucheId(
            query.rucheId,
            query.pagination,
            query.sort,
            query.filters,
        );
    }
}
```

- [ ] Créer `src/application/inspection/queries/get-inspection.query.ts` :

```typescript
export class GetInspectionQuery {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

- [ ] Créer `src/application/inspection/queries/get-inspection.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetInspectionQuery } from './get-inspection.query';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@QueryHandler(GetInspectionQuery)
export class GetInspectionHandler
    implements IQueryHandler<GetInspectionQuery>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(query: GetInspectionQuery): Promise<InspectionEntity> {
        const inspection = await this.inspectionRepository.findById(query.id);
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${query.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access this inspection',
            );
        }

        return inspection;
    }
}
```

- [ ] Créer `src/application/inspection/index.ts` :

 - [x] Créer `src/application/inspection/commands/create-inspection.command.ts` :

```typescript
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class CreateInspectionCommand {
    constructor(
        public readonly date: Date,
        public readonly etatGeneral: EtatGeneral,
        public readonly rucheId: string,
        public readonly userId: string,
        public readonly niveauReserve?: NiveauReserve | null,
        public readonly comportement?: Comportement | null,
        public readonly presenceReine?: boolean | null,
        public readonly nombreCadres?: number | null,
        public readonly presenceMaladie?: boolean | null,
        public readonly descriptionMaladie?: string | null,
        public readonly traitementApplique?: string | null,
        public readonly recolteKg?: number | null,
        public readonly notes?: string | null,
    ) {}
}
```

 - [x] Créer `src/application/inspection/commands/create-inspection.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInspectionCommand } from './create-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(CreateInspectionCommand)
export class CreateInspectionHandler
    implements ICommandHandler<CreateInspectionCommand>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        command: CreateInspectionCommand,
    ): Promise<InspectionEntity> {
        const ruche = await this.rucheRepository.findById(command.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to add an inspection to this ruche',
            );
        }

        const inspection = InspectionEntity.create({
            date: command.date,
            etatGeneral: command.etatGeneral,
            niveauReserve: command.niveauReserve,
            comportement: command.comportement,
            presenceReine: command.presenceReine,
            nombreCadres: command.nombreCadres,
            presenceMaladie: command.presenceMaladie,
            descriptionMaladie: command.descriptionMaladie,
            traitementApplique: command.traitementApplique,
            recolteKg: command.recolteKg,
            notes: command.notes,
            rucheId: command.rucheId,
        });

        return this.inspectionRepository.create(inspection);
    }
}
```

 - [x] Créer `src/application/inspection/commands/update-inspection.command.ts` :

```typescript
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class UpdateInspectionCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly date?: Date,
        public readonly etatGeneral?: EtatGeneral,
        public readonly niveauReserve?: NiveauReserve | null,
        public readonly comportement?: Comportement | null,
        public readonly presenceReine?: boolean | null,
        public readonly nombreCadres?: number | null,
        public readonly presenceMaladie?: boolean | null,
        public readonly descriptionMaladie?: string | null,
        public readonly traitementApplique?: string | null,
        public readonly recolteKg?: number | null,
        public readonly notes?: string | null,
    ) {}
}
```

 - [x] Créer `src/application/inspection/commands/update-inspection.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateInspectionCommand } from './update-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(UpdateInspectionCommand)
export class UpdateInspectionHandler
    implements ICommandHandler<UpdateInspectionCommand>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        command: UpdateInspectionCommand,
    ): Promise<InspectionEntity> {
        const inspection = await this.inspectionRepository.findById(
            command.id,
        );
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${command.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this inspection',
            );
        }

        const updateData: Partial<InspectionEntity> = {};

        if (command.date !== undefined) {
            (updateData as Record<string, unknown>).date = command.date;
        }

        if (command.etatGeneral !== undefined) {
            (updateData as Record<string, unknown>).etatGeneral =
                command.etatGeneral;
        }

        if (command.niveauReserve !== undefined) {
            (updateData as Record<string, unknown>).niveauReserve =
                command.niveauReserve ?? null;
        }

        if (command.comportement !== undefined) {
            (updateData as Record<string, unknown>).comportement =
                command.comportement ?? null;
        }

        if (command.presenceReine !== undefined) {
            (updateData as Record<string, unknown>).presenceReine =
                command.presenceReine ?? null;
        }

        if (command.nombreCadres !== undefined) {
            if (
                command.nombreCadres !== null &&
                command.nombreCadres !== undefined &&
                command.nombreCadres < 0
            ) {
                throw new Error('Inspection nombreCadres cannot be negative');
            }
            (updateData as Record<string, unknown>).nombreCadres =
                command.nombreCadres ?? null;
        }

        if (command.presenceMaladie !== undefined) {
            (updateData as Record<string, unknown>).presenceMaladie =
                command.presenceMaladie ?? null;
        }

        if (command.descriptionMaladie !== undefined) {
            (updateData as Record<string, unknown>).descriptionMaladie =
                command.descriptionMaladie?.trim() ?? null;
        }

        if (command.traitementApplique !== undefined) {
            (updateData as Record<string, unknown>).traitementApplique =
                command.traitementApplique?.trim() ?? null;
        }

        if (command.recolteKg !== undefined) {
            if (
                command.recolteKg !== null &&
                command.recolteKg !== undefined &&
                command.recolteKg < 0
            ) {
                throw new Error('Inspection recolteKg cannot be negative');
            }
            (updateData as Record<string, unknown>).recolteKg =
                command.recolteKg ?? null;
        }

        if (command.notes !== undefined) {
            (updateData as Record<string, unknown>).notes =
                command.notes?.trim() ?? null;
        }

        return this.inspectionRepository.update(command.id, updateData);
    }
}
```

 - [x] Créer `src/application/inspection/commands/delete-inspection.command.ts` :

```typescript
export class DeleteInspectionCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

 - [x] Créer `src/application/inspection/commands/delete-inspection.handler.ts` :

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteInspectionCommand } from './delete-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(DeleteInspectionCommand)
export class DeleteInspectionHandler
    implements ICommandHandler<DeleteInspectionCommand>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(command: DeleteInspectionCommand): Promise<void> {
        const inspection = await this.inspectionRepository.findById(
            command.id,
        );
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${command.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this inspection',
            );
        }

        await this.inspectionRepository.delete(command.id);
    }
}
```

 - [x] Créer `src/application/inspection/queries/list-inspections.query.ts` :

```typescript
import { PaginationParams, SortParams } from '@shared/types';
import { InspectionFilters } from '@domain/inspection/repositories/inspection.repository.interface';

export class ListInspectionsQuery {
    constructor(
        public readonly rucheId: string,
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: InspectionFilters,
    ) {}
}
```

 - [x] Créer `src/application/inspection/queries/list-inspections.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListInspectionsQuery } from './list-inspections.query';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { PaginatedResult } from '@shared/types';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@QueryHandler(ListInspectionsQuery)
export class ListInspectionsHandler
    implements IQueryHandler<ListInspectionsQuery>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(
        query: ListInspectionsQuery,
    ): Promise<PaginatedResult<InspectionEntity>> {
        const ruche = await this.rucheRepository.findById(query.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${query.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access inspections of this ruche',
            );
        }

        return this.inspectionRepository.findAllByRucheId(
            query.rucheId,
            query.pagination,
            query.sort,
            query.filters,
        );
    }
}
```

 - [x] Créer `src/application/inspection/queries/get-inspection.query.ts` :

```typescript
export class GetInspectionQuery {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {}
}
```

 - [x] Créer `src/application/inspection/queries/get-inspection.handler.ts` :

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetInspectionQuery } from './get-inspection.query';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@QueryHandler(GetInspectionQuery)
export class GetInspectionHandler
    implements IQueryHandler<GetInspectionQuery>
{
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) {}

    async execute(query: GetInspectionQuery): Promise<InspectionEntity> {
        const inspection = await this.inspectionRepository.findById(query.id);
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${query.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== query.userId) {
            throw new ForbiddenException(
                'You do not have permission to access this inspection',
            );
        }

        return inspection;
    }
}
```

 - [x] Créer `src/application/inspection/index.ts` :

```typescript
export { CreateInspectionCommand } from './commands/create-inspection.command';
export { CreateInspectionHandler } from './commands/create-inspection.handler';
export { UpdateInspectionCommand } from './commands/update-inspection.command';
export { UpdateInspectionHandler } from './commands/update-inspection.handler';
export { DeleteInspectionCommand } from './commands/delete-inspection.command';
export { DeleteInspectionHandler } from './commands/delete-inspection.handler';
export { ListInspectionsQuery } from './queries/list-inspections.query';
export { ListInspectionsHandler } from './queries/list-inspections.handler';
export { GetInspectionQuery } from './queries/get-inspection.query';
export { GetInspectionHandler } from './queries/get-inspection.handler';
```

##### Step 4.4 Verification Checklist
 - [x] Aucune erreur TypeScript dans les 11 fichiers créés
 - [x] Les handlers Inspection injectent `IRucheRepository` + `IRucherRepository` pour remonter la chaîne d'ownership (Inspection → Ruche → Rucher → User)
 - [x] La vérification d'ownership est présente dans tous les handlers

#### Step 4.4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

```typescript
export { CreateInspectionCommand } from './commands/create-inspection.command';
export { CreateInspectionHandler } from './commands/create-inspection.handler';
export { UpdateInspectionCommand } from './commands/update-inspection.command';
export { UpdateInspectionHandler } from './commands/update-inspection.handler';
export { DeleteInspectionCommand } from './commands/delete-inspection.command';
export { DeleteInspectionHandler } from './commands/delete-inspection.handler';
export { ListInspectionsQuery } from './queries/list-inspections.query';
export { ListInspectionsHandler } from './queries/list-inspections.handler';
export { GetInspectionQuery } from './queries/get-inspection.query';
export { GetInspectionHandler } from './queries/get-inspection.handler';
```

##### Step 4.4 Verification Checklist
- [ ] Aucune erreur TypeScript dans les 11 fichiers créés
- [ ] Les handlers Inspection injectent `IRucheRepository` + `IRucherRepository` pour remonter la chaîne d'ownership (Inspection → Ruche → Rucher → User)
- [ ] La vérification d'ownership est présente dans tous les handlers

#### Step 4.4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4.5 : Barrel Export & Mise à jour AppModule avec CqrsModule

- [ ] Créer `src/application/index.ts` :

```typescript
// User
export {
    RegisterUserCommand,
    RegisterUserHandler,
    GetUserQuery,
    GetUserHandler,
} from './user';

// Rucher
export {
    CreateRucherCommand,
    CreateRucherHandler,
    UpdateRucherCommand,
    UpdateRucherHandler,
    DeleteRucherCommand,
    DeleteRucherHandler,
    ListRuchersQuery,
    ListRuchersHandler,
    GetRucherQuery,
    GetRucherHandler,
} from './rucher';

// Ruche
export {
    CreateRucheCommand,
    CreateRucheHandler,
    UpdateRucheCommand,
    UpdateRucheHandler,
    DeleteRucheCommand,
    DeleteRucheHandler,
    ListRuchesQuery,
    ListRuchesHandler,
    GetRucheQuery,
    GetRucheHandler,
} from './ruche';

// Inspection
export {
    CreateInspectionCommand,
    CreateInspectionHandler,
    UpdateInspectionCommand,
    UpdateInspectionHandler,
    DeleteInspectionCommand,
    DeleteInspectionHandler,
    ListInspectionsQuery,
    ListInspectionsHandler,
    GetInspectionQuery,
    GetInspectionHandler,
} from './inspection';
```

- [ ] Mettre à jour `src/app.module.ts` pour importer `CqrsModule` :

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
    imports: [AppConfigModule, PrismaModule, CqrsModule.forRoot()],
    controllers: [],
    providers: [],
})
export class AppModule {}
```

##### Step 4.5 Verification Checklist
- [ ] `npm run build` compile sans erreur
- [ ] Le barrel export `src/application/index.ts` exporte les 20 classes (10 commands/queries + 10 handlers)
- [ ] `CqrsModule.forRoot()` est présent dans les imports de `AppModule`
- [ ] `npm run start:dev` démarre sans erreur

#### Step 4.5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

## Résumé des fichiers créés

| # | Fichier | Description |
|---|---------|-------------|
| 1 | `src/application/user/commands/register-user.command.ts` | Command d'inscription utilisateur |
| 2 | `src/application/user/commands/register-user.handler.ts` | Handler : hash bcrypt + vérif unicité email |
| 3 | `src/application/user/queries/get-user.query.ts` | Query lecture utilisateur par ID |
| 4 | `src/application/user/queries/get-user.handler.ts` | Handler : lookup + 404 |
| 5 | `src/application/user/index.ts` | Barrel export user |
| 6 | `src/application/rucher/commands/create-rucher.command.ts` | Command création rucher |
| 7 | `src/application/rucher/commands/create-rucher.handler.ts` | Handler : création via entité domaine |
| 8 | `src/application/rucher/commands/update-rucher.command.ts` | Command mise à jour rucher |
| 9 | `src/application/rucher/commands/update-rucher.handler.ts` | Handler : ownership + update partiel |
| 10 | `src/application/rucher/commands/delete-rucher.command.ts` | Command suppression rucher |
| 11 | `src/application/rucher/commands/delete-rucher.handler.ts` | Handler : ownership + delete |
| 12 | `src/application/rucher/queries/list-ruchers.query.ts` | Query liste ruchers paginée/filtrée |
| 13 | `src/application/rucher/queries/list-ruchers.handler.ts` | Handler : pagination via repository |
| 14 | `src/application/rucher/queries/get-rucher.query.ts` | Query lecture rucher par ID |
| 15 | `src/application/rucher/queries/get-rucher.handler.ts` | Handler : ownership + 404 |
| 16 | `src/application/rucher/index.ts` | Barrel export rucher |
| 17 | `src/application/ruche/commands/create-ruche.command.ts` | Command création ruche |
| 18 | `src/application/ruche/commands/create-ruche.handler.ts` | Handler : ownership rucher parent + création |
| 19 | `src/application/ruche/commands/update-ruche.command.ts` | Command mise à jour ruche |
| 20 | `src/application/ruche/commands/update-ruche.handler.ts` | Handler : ownership via rucher + update partiel |
| 21 | `src/application/ruche/commands/delete-ruche.command.ts` | Command suppression ruche |
| 22 | `src/application/ruche/commands/delete-ruche.handler.ts` | Handler : ownership via rucher + delete |
| 23 | `src/application/ruche/queries/list-ruches.query.ts` | Query liste ruches paginée/filtrée |
| 24 | `src/application/ruche/queries/list-ruches.handler.ts` | Handler : ownership rucher + pagination |
| 25 | `src/application/ruche/queries/get-ruche.query.ts` | Query lecture ruche par ID |
| 26 | `src/application/ruche/queries/get-ruche.handler.ts` | Handler : ownership via rucher + 404 |
| 27 | `src/application/ruche/index.ts` | Barrel export ruche |
| 28 | `src/application/inspection/commands/create-inspection.command.ts` | Command création inspection |
| 29 | `src/application/inspection/commands/create-inspection.handler.ts` | Handler : ownership ruche→rucher + création |
| 30 | `src/application/inspection/commands/update-inspection.command.ts` | Command mise à jour inspection |
| 31 | `src/application/inspection/commands/update-inspection.handler.ts` | Handler : ownership chaîne complète + update |
| 32 | `src/application/inspection/commands/delete-inspection.command.ts` | Command suppression inspection |
| 33 | `src/application/inspection/commands/delete-inspection.handler.ts` | Handler : ownership chaîne complète + delete |
| 34 | `src/application/inspection/queries/list-inspections.query.ts` | Query liste inspections paginée/filtrée |
| 35 | `src/application/inspection/queries/list-inspections.handler.ts` | Handler : ownership chaîne + pagination |
| 36 | `src/application/inspection/queries/get-inspection.query.ts` | Query lecture inspection par ID |
| 37 | `src/application/inspection/queries/get-inspection.handler.ts` | Handler : ownership chaîne complète + 404 |
| 38 | `src/application/inspection/index.ts` | Barrel export inspection |
| 39 | `src/application/index.ts` | Barrel export global application |
| 40 | `src/app.module.ts` | Mise à jour : ajout `CqrsModule.forRoot()` |

## Patterns clés utilisés

| Pattern | Détail |
|---------|--------|
| **CQRS** | Séparation stricte Commands (écriture) / Queries (lecture) via `@nestjs/cqrs` |
| **Dependency Inversion** | Injection des interfaces repository via `@Inject(SYMBOL)`, pas d'implémentation concrète |
| **Ownership Check** | Rucher → vérifie `userId` direct. Ruche → remonte au Rucher parent. Inspection → remonte Ruche → Rucher |
| **NestJS Exceptions** | `NotFoundException` (404), `ForbiddenException` (403), `ConflictException` (409) |
| **Pagination** | Queries de liste acceptent `PaginationParams` + `SortParams` + filtres métier, retournent `PaginatedResult<T>` |
| **Bcrypt** | Hash avec salt rounds = 12 dans `RegisterUserHandler` |
