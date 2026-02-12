# Step 9 — Tests unitaires & d'intégration complets

## Goal

Mettre en place Jest avec ts-jest, écrire les tests unitaires (domaine + application), les tests E2E (auth, rucher, ruche, inspection) avec repositories in-memory, et les tests d'intégration (repositories Prisma contre la base réelle).

## Prerequisites

- Steps 1–8 complétées
- `npm run build` compile sans erreur
- Branche `feat/tests-unitaires-integration`

---

### Step-by-Step Instructions

---

#### Step 9.1 : Installer les dépendances de test & configurer Jest

- [ ] Installer les dépendances de test :

```bash
npm install --save-dev jest ts-jest @types/jest @nestjs/testing supertest
```

- [ ] Créer le fichier `jest.config.ts` à la racine du projet avec le contenu ci-dessous :

```typescript
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/generated/**',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@generated/(.*)$': '<rootDir>/src/generated/$1',
  },
};

export default config;
```

- [ ] Créer le fichier `tsconfig.test.json` à la racine :

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] Ajouter les scripts de test dans `package.json`. Remplacer le bloc `"scripts"` **existant** :

```json
    "scripts": {
        "build": "tsc -p tsconfig.build.json",
        "start": "node dist/main.js",
        "start:dev": "nest start --watch",
        "lint": "eslint . --ext .ts",
        "format": "prettier --write \"**/*.{ts,js,json,md}\""
    },
```

Par :

```json
    "scripts": {
        "build": "tsc -p tsconfig.build.json",
        "start": "node dist/main.js",
        "start:dev": "nest start --watch",
        "lint": "eslint . --ext .ts",
        "format": "prettier --write \"**/*.{ts,js,json,md}\"",
        "test": "jest",
        "test:unit": "jest --testPathPattern=test/unit",
        "test:integration": "jest --testPathPattern=test/integration",
        "test:e2e": "jest --testPathPattern=test/e2e --forceExit --detectOpenHandles",
        "test:cov": "jest --coverage"
    },
```

##### Step 9.1 Verification Checklist

- [ ] `npx jest --version` affiche la version de Jest
- [ ] `npm run build` compile toujours sans erreur

#### Step 9.1 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 9.2 : Tests unitaires — Couche Domaine

- [ ] Créer `test/unit/domain/email.vo.spec.ts` :

```typescript
import { Email } from '@domain/user/value-objects/email.vo';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid Email from a valid email string', () => {
      const email = Email.create('Test@Example.COM');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should normalize email to lowercase and trim whitespace', () => {
      const email = Email.create('  User@Domain.FR  ');
      expect(email.toString()).toBe('user@domain.fr');
    });

    it('should throw an error for an empty string', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
    });

    it('should throw an error for whitespace-only string', () => {
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw an error for an email without @', () => {
      expect(() => Email.create('invalidemail')).toThrow('Invalid email format');
    });

    it('should throw an error for an email without domain', () => {
      expect(() => Email.create('user@')).toThrow('Invalid email format');
    });

    it('should throw an error for an email without local part', () => {
      expect(() => Email.create('@domain.com')).toThrow('Invalid email format');
    });

    it('should throw an error for an email without TLD', () => {
      expect(() => Email.create('user@domain')).toThrow('Invalid email format');
    });
  });

  describe('equals', () => {
    it('should return true for two emails with the same value', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('USER@EXAMPLE.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for two different emails', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the normalized email string', () => {
      const email = Email.create('Apiculteur@Rucher.FR');
      expect(email.toString()).toBe('apiculteur@rucher.fr');
    });
  });
});
```

- [ ] Créer `test/unit/domain/coordonnees-gps.vo.spec.ts` :

```typescript
import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';

describe('CoordonneesGps Value Object', () => {
  describe('create', () => {
    it('should create valid GPS coordinates', () => {
      const coords = CoordonneesGps.create(43.6047, 1.4442);
      expect(coords.latitude).toBe(43.6047);
      expect(coords.longitude).toBe(1.4442);
    });

    it('should accept boundary values (-90, -180)', () => {
      const coords = CoordonneesGps.create(-90, -180);
      expect(coords.latitude).toBe(-90);
      expect(coords.longitude).toBe(-180);
    });

    it('should accept boundary values (90, 180)', () => {
      const coords = CoordonneesGps.create(90, 180);
      expect(coords.latitude).toBe(90);
      expect(coords.longitude).toBe(180);
    });

    it('should accept zero coordinates (0, 0)', () => {
      const coords = CoordonneesGps.create(0, 0);
      expect(coords.latitude).toBe(0);
      expect(coords.longitude).toBe(0);
    });

    it('should throw for latitude below -90', () => {
      expect(() => CoordonneesGps.create(-91, 0)).toThrow(
        'Invalid latitude: -91. Must be between -90 and 90.',
      );
    });

    it('should throw for latitude above 90', () => {
      expect(() => CoordonneesGps.create(91, 0)).toThrow(
        'Invalid latitude: 91. Must be between -90 and 90.',
      );
    });

    it('should throw for longitude below -180', () => {
      expect(() => CoordonneesGps.create(0, -181)).toThrow(
        'Invalid longitude: -181. Must be between -180 and 180.',
      );
    });

    it('should throw for longitude above 180', () => {
      expect(() => CoordonneesGps.create(0, 181)).toThrow(
        'Invalid longitude: 181. Must be between -180 and 180.',
      );
    });
  });

  describe('equals', () => {
    it('should return true for identical coordinates', () => {
      const c1 = CoordonneesGps.create(43.6047, 1.4442);
      const c2 = CoordonneesGps.create(43.6047, 1.4442);
      expect(c1.equals(c2)).toBe(true);
    });

    it('should return false for different coordinates', () => {
      const c1 = CoordonneesGps.create(43.6047, 1.4442);
      const c2 = CoordonneesGps.create(48.8566, 2.3522);
      expect(c1.equals(c2)).toBe(false);
    });
  });
});
```

##### Step 9.2 Verification Checklist

- [ ] `npm run test:unit` exécute les 2 fichiers de tests domaine
- [ ] Tous les tests passent au vert

#### Step 9.2 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 9.3 : Tests unitaires — Couche Application

- [ ] Créer `test/unit/application/register-user.handler.spec.ts` :

```typescript
import { ConflictException } from '@nestjs/common';
import { RegisterUserHandler } from '@application/user/commands/register-user.handler';
import { RegisterUserCommand } from '@application/user/commands/register-user.command';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { Email } from '@domain/user/value-objects/email.vo';
import { Role } from '@domain/enums';

describe('RegisterUserHandler', () => {
  let handler: RegisterUserHandler;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    handler = new RegisterUserHandler(userRepository);
  });

  it('should register a new user with hashed password', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const command = new RegisterUserCommand('test@example.com', 'Password123!', 'Dupont', 'Jean');

    const result = await handler.execute(command);

    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(userRepository.create).toHaveBeenCalled();
    expect(result.nom).toBe('Dupont');
    expect(result.prenom).toBe('Jean');
    expect(result.email.toString()).toBe('test@example.com');
    // Password must be hashed, not plain text
    expect(result.password).not.toBe('Password123!');
    expect(result.password).toMatch(/^\$2[aby]\$/);
  });

  it('should throw ConflictException if email already exists', async () => {
    const existingUser = UserEntity.fromPersistence({
      id: 'existing-id',
      email: Email.create('test@example.com'),
      password: 'hashed',
      nom: 'Existant',
      prenom: 'User',
      role: Role.APICULTEUR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userRepository.findByEmail.mockResolvedValue(existingUser);

    const command = new RegisterUserCommand('test@example.com', 'Password123!', 'Dupont', 'Jean');

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('should assign APICULTEUR role by default', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const command = new RegisterUserCommand('test@example.com', 'Password123!', 'Dupont', 'Jean');

    const result = await handler.execute(command);
    expect(result.role).toBe(Role.APICULTEUR);
  });
});
```

- [ ] Créer `test/unit/application/create-rucher.handler.spec.ts` :

```typescript
import { CreateRucherHandler } from '@application/rucher/commands/create-rucher.handler';
import { CreateRucherCommand } from '@application/rucher/commands/create-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';

describe('CreateRucherHandler', () => {
  let handler: CreateRucherHandler;
  let rucherRepository: jest.Mocked<IRucherRepository>;

  beforeEach(() => {
    rucherRepository = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    handler = new CreateRucherHandler(rucherRepository);
  });

  it('should create a rucher successfully', async () => {
    rucherRepository.create.mockImplementation(async (rucher) => rucher);

    const command = new CreateRucherCommand(
      'Rucher des Tilleuls',
      'user-id-1',
      '12 chemin des Abeilles',
      43.6047,
      1.4442,
      'Rucher principal',
    );

    const result = await handler.execute(command);

    expect(rucherRepository.create).toHaveBeenCalled();
    expect(result.nom).toBe('Rucher des Tilleuls');
    expect(result.userId).toBe('user-id-1');
    expect(result.adresse).toBe('12 chemin des Abeilles');
    expect(result.coordonnees).not.toBeNull();
    expect(result.coordonnees!.latitude).toBe(43.6047);
    expect(result.coordonnees!.longitude).toBe(1.4442);
    expect(result.description).toBe('Rucher principal');
  });

  it('should create a rucher without optional fields', async () => {
    rucherRepository.create.mockImplementation(async (rucher) => rucher);

    const command = new CreateRucherCommand('Rucher Simple', 'user-id-1');

    const result = await handler.execute(command);

    expect(result.nom).toBe('Rucher Simple');
    expect(result.adresse).toBeNull();
    expect(result.coordonnees).toBeNull();
    expect(result.description).toBeNull();
  });

  it('should throw if rucher name is empty', async () => {
    const command = new CreateRucherCommand('', 'user-id-1');

    await expect(handler.execute(command)).rejects.toThrow('Rucher nom cannot be empty');
    expect(rucherRepository.create).not.toHaveBeenCalled();
  });
});
```

- [ ] Créer `test/unit/application/create-ruche.handler.spec.ts` :

```typescript
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateRucheHandler } from '@application/ruche/commands/create-ruche.handler';
import { CreateRucheCommand } from '@application/ruche/commands/create-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { TypeRuche, StatutRuche } from '@domain/enums';

describe('CreateRucheHandler', () => {
  let handler: CreateRucheHandler;
  let rucheRepository: jest.Mocked<IRucheRepository>;
  let rucherRepository: jest.Mocked<IRucherRepository>;

  const mockRucher = RucherEntity.fromPersistence({
    id: 'rucher-id-1',
    nom: 'Test Rucher',
    adresse: null,
    coordonnees: null,
    description: null,
    userId: 'user-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    rucheRepository = {
      findById: jest.fn(),
      findAllByRucherId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    rucherRepository = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    handler = new CreateRucheHandler(rucheRepository, rucherRepository);
  });

  it('should create a ruche in an owned rucher', async () => {
    rucherRepository.findById.mockResolvedValue(mockRucher);
    rucheRepository.create.mockImplementation(async (ruche) => ruche);

    const command = new CreateRucheCommand(
      'Ruche Alpha',
      'rucher-id-1',
      'user-id-1',
      TypeRuche.DADANT,
      StatutRuche.ACTIVE,
    );

    const result = await handler.execute(command);

    expect(rucherRepository.findById).toHaveBeenCalledWith('rucher-id-1');
    expect(rucheRepository.create).toHaveBeenCalled();
    expect(result.nom).toBe('Ruche Alpha');
    expect(result.type).toBe(TypeRuche.DADANT);
    expect(result.rucherId).toBe('rucher-id-1');
  });

  it('should throw NotFoundException if rucher does not exist', async () => {
    rucherRepository.findById.mockResolvedValue(null);

    const command = new CreateRucheCommand('Ruche Alpha', 'unknown-rucher', 'user-id-1');

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(rucheRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if rucher belongs to another user', async () => {
    rucherRepository.findById.mockResolvedValue(mockRucher);

    const command = new CreateRucheCommand('Ruche Alpha', 'rucher-id-1', 'other-user-id');

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(rucheRepository.create).not.toHaveBeenCalled();
  });
});
```

- [ ] Créer `test/unit/application/create-inspection.handler.spec.ts` :

```typescript
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInspectionHandler } from '@application/inspection/commands/create-inspection.handler';
import { CreateInspectionCommand } from '@application/inspection/commands/create-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { EtatGeneral, TypeRuche, StatutRuche } from '@domain/enums';

describe('CreateInspectionHandler', () => {
  let handler: CreateInspectionHandler;
  let inspectionRepository: jest.Mocked<IInspectionRepository>;
  let rucheRepository: jest.Mocked<IRucheRepository>;
  let rucherRepository: jest.Mocked<IRucherRepository>;

  const mockRucher = RucherEntity.fromPersistence({
    id: 'rucher-id-1',
    nom: 'Test Rucher',
    adresse: null,
    coordonnees: null,
    description: null,
    userId: 'user-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockRuche = RucheEntity.fromPersistence({
    id: 'ruche-id-1',
    nom: 'Test Ruche',
    type: TypeRuche.DADANT,
    statut: StatutRuche.ACTIVE,
    dateAchat: null,
    notes: null,
    rucherId: 'rucher-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    inspectionRepository = {
      findById: jest.fn(),
      findAllByRucheId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    rucheRepository = {
      findById: jest.fn(),
      findAllByRucherId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    rucherRepository = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    handler = new CreateInspectionHandler(inspectionRepository, rucheRepository, rucherRepository);
  });

  it('should create an inspection for an owned ruche', async () => {
    rucheRepository.findById.mockResolvedValue(mockRuche);
    rucherRepository.findById.mockResolvedValue(mockRucher);
    inspectionRepository.create.mockImplementation(async (i) => i);

    const command = new CreateInspectionCommand(
      new Date('2025-06-15'),
      EtatGeneral.BON,
      'ruche-id-1',
      'user-id-1',
    );

    const result = await handler.execute(command);

    expect(rucheRepository.findById).toHaveBeenCalledWith('ruche-id-1');
    expect(rucherRepository.findById).toHaveBeenCalledWith('rucher-id-1');
    expect(inspectionRepository.create).toHaveBeenCalled();
    expect(result.etatGeneral).toBe(EtatGeneral.BON);
    expect(result.rucheId).toBe('ruche-id-1');
  });

  it('should throw NotFoundException if ruche does not exist', async () => {
    rucheRepository.findById.mockResolvedValue(null);

    const command = new CreateInspectionCommand(
      new Date('2025-06-15'),
      EtatGeneral.BON,
      'unknown-ruche',
      'user-id-1',
    );

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(inspectionRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if rucher belongs to another user', async () => {
    rucheRepository.findById.mockResolvedValue(mockRuche);
    rucherRepository.findById.mockResolvedValue(mockRucher);

    const command = new CreateInspectionCommand(
      new Date('2025-06-15'),
      EtatGeneral.BON,
      'ruche-id-1',
      'other-user-id',
    );

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(inspectionRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if rucher is not found for ruche', async () => {
    rucheRepository.findById.mockResolvedValue(mockRuche);
    rucherRepository.findById.mockResolvedValue(null);

    const command = new CreateInspectionCommand(
      new Date('2025-06-15'),
      EtatGeneral.BON,
      'ruche-id-1',
      'user-id-1',
    );

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
  });
});
```

##### Step 9.3 Verification Checklist

- [ ] `npm run test:unit` exécute les 6 fichiers de tests (2 domaine + 4 application)
- [ ] Tous les tests passent au vert

#### Step 9.3 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 9.4 : Tests E2E — Helpers & Auth

- [ ] Créer `test/helpers/mock-repositories.ts` (repositories in-memory pour les tests E2E) :

```typescript
import { randomUUID } from 'crypto';
import { UserEntity } from '@domain/user/entities/user.entity';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { RefreshTokenEntity } from '@domain/user/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '@domain/user/repositories/refresh-token.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import {
  IRucherRepository,
  RucherFilters,
} from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import {
  IRucheRepository,
  RucheFilters,
} from '@domain/ruche/repositories/ruche.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import {
  IInspectionRepository,
  InspectionFilters,
} from '@domain/inspection/repositories/inspection.repository.interface';
import { PaginationParams, SortParams, PaginatedResult } from '@shared/types';

// ── User ───────────────────────────────────────
export class MockUserRepository implements IUserRepository {
  private users = new Map<string, UserEntity>();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toString() === normalized) return user;
    }
    return null;
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const id = randomUUID();
    const saved = UserEntity.fromPersistence({
      id,
      email: user.email,
      password: user.password,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    this.users.set(id, saved);
    return saved;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const existing = this.users.get(id);
    if (!existing) throw new Error('User not found');
    const updated = UserEntity.fromPersistence({
      id,
      email: (data as any).email ?? existing.email,
      password: (data as any).password ?? existing.password,
      nom: (data as any).nom ?? existing.nom,
      prenom: (data as any).prenom ?? existing.prenom,
      role: (data as any).role ?? existing.role,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  reset(): void {
    this.users.clear();
  }
}

// ── RefreshToken ───────────────────────────────
export class MockRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens = new Map<string, RefreshTokenEntity>();

  async create(rt: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const id = randomUUID();
    const saved = RefreshTokenEntity.fromPersistence({
      id,
      token: rt.token,
      userId: rt.userId,
      expiresAt: rt.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
    this.tokens.set(id, saved);
    return saved;
  }

  async findByToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
    for (const t of this.tokens.values()) {
      if (t.token === tokenHash) return t;
    }
    return null;
  }

  async revokeByToken(tokenHash: string): Promise<void> {
    for (const [id, t] of this.tokens.entries()) {
      if (t.token === tokenHash) {
        this.tokens.set(
          id,
          RefreshTokenEntity.fromPersistence({
            id: t.id,
            token: t.token,
            userId: t.userId,
            expiresAt: t.expiresAt,
            revokedAt: new Date(),
            createdAt: t.createdAt,
          }),
        );
        break;
      }
    }
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    for (const [id, t] of this.tokens.entries()) {
      if (t.userId === userId && !t.isRevoked) {
        this.tokens.set(
          id,
          RefreshTokenEntity.fromPersistence({
            id: t.id,
            token: t.token,
            userId: t.userId,
            expiresAt: t.expiresAt,
            revokedAt: new Date(),
            createdAt: t.createdAt,
          }),
        );
      }
    }
  }

  async deleteExpired(): Promise<number> {
    let count = 0;
    for (const [id, t] of this.tokens.entries()) {
      if (t.isExpired) {
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }

  reset(): void {
    this.tokens.clear();
  }
}

// ── Rucher ─────────────────────────────────────
export class MockRucherRepository implements IRucherRepository {
  private ruchers = new Map<string, RucherEntity>();

  async findById(id: string): Promise<RucherEntity | null> {
    return this.ruchers.get(id) ?? null;
  }

  async findAllByUserId(
    userId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucherFilters,
  ): Promise<PaginatedResult<RucherEntity>> {
    let items = Array.from(this.ruchers.values()).filter((r) => r.userId === userId);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(
        (r) => r.nom.toLowerCase().includes(s) || (r.adresse?.toLowerCase().includes(s) ?? false),
      );
    }
    if (sort?.sortBy) {
      items.sort((a, b) => {
        const av = (a as any)[sort.sortBy];
        const bv = (b as any)[sort.sortBy];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.sortOrder === 'asc' ? cmp : -cmp;
      });
    }
    const total = items.length;
    const start = (pagination.page - 1) * pagination.limit;
    items = items.slice(start, start + pagination.limit);
    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  async create(rucher: RucherEntity): Promise<RucherEntity> {
    const id = randomUUID();
    const saved = RucherEntity.fromPersistence({
      id,
      nom: rucher.nom,
      adresse: rucher.adresse,
      coordonnees: rucher.coordonnees,
      description: rucher.description,
      userId: rucher.userId,
      createdAt: rucher.createdAt,
      updatedAt: rucher.updatedAt,
    });
    this.ruchers.set(id, saved);
    return saved;
  }

  async update(id: string, data: Partial<RucherEntity>): Promise<RucherEntity> {
    const existing = this.ruchers.get(id);
    if (!existing) throw new Error('Rucher not found');
    const updated = RucherEntity.fromPersistence({
      id,
      nom: (data as any).nom ?? existing.nom,
      adresse: (data as any).adresse !== undefined ? (data as any).adresse : existing.adresse,
      coordonnees:
        (data as any).coordonnees !== undefined ? (data as any).coordonnees : existing.coordonnees,
      description:
        (data as any).description !== undefined ? (data as any).description : existing.description,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.ruchers.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.ruchers.delete(id);
  }

  reset(): void {
    this.ruchers.clear();
  }
}

// ── Ruche ──────────────────────────────────────
export class MockRucheRepository implements IRucheRepository {
  private ruches = new Map<string, RucheEntity>();

  async findById(id: string): Promise<RucheEntity | null> {
    return this.ruches.get(id) ?? null;
  }

  async findAllByRucherId(
    rucherId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucheFilters,
  ): Promise<PaginatedResult<RucheEntity>> {
    let items = Array.from(this.ruches.values()).filter((r) => r.rucherId === rucherId);
    if (filters?.statut) items = items.filter((r) => r.statut === filters.statut);
    if (filters?.type) items = items.filter((r) => r.type === filters.type);
    const total = items.length;
    const start = (pagination.page - 1) * pagination.limit;
    items = items.slice(start, start + pagination.limit);
    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  async create(ruche: RucheEntity): Promise<RucheEntity> {
    const id = randomUUID();
    const saved = RucheEntity.fromPersistence({
      id,
      nom: ruche.nom,
      type: ruche.type,
      statut: ruche.statut,
      dateAchat: ruche.dateAchat,
      notes: ruche.notes,
      rucherId: ruche.rucherId,
      createdAt: ruche.createdAt,
      updatedAt: ruche.updatedAt,
    });
    this.ruches.set(id, saved);
    return saved;
  }

  async update(id: string, data: Partial<RucheEntity>): Promise<RucheEntity> {
    const existing = this.ruches.get(id);
    if (!existing) throw new Error('Ruche not found');
    const updated = RucheEntity.fromPersistence({
      id,
      nom: (data as any).nom ?? existing.nom,
      type: (data as any).type ?? existing.type,
      statut: (data as any).statut ?? existing.statut,
      dateAchat:
        (data as any).dateAchat !== undefined ? (data as any).dateAchat : existing.dateAchat,
      notes: (data as any).notes !== undefined ? (data as any).notes : existing.notes,
      rucherId: existing.rucherId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.ruches.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.ruches.delete(id);
  }

  reset(): void {
    this.ruches.clear();
  }
}

// ── Inspection ─────────────────────────────────
export class MockInspectionRepository implements IInspectionRepository {
  private inspections = new Map<string, InspectionEntity>();

  async findById(id: string): Promise<InspectionEntity | null> {
    return this.inspections.get(id) ?? null;
  }

  async findAllByRucheId(
    rucheId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: InspectionFilters,
  ): Promise<PaginatedResult<InspectionEntity>> {
    let items = Array.from(this.inspections.values()).filter((i) => i.rucheId === rucheId);
    if (filters?.etatGeneral) items = items.filter((i) => i.etatGeneral === filters.etatGeneral);
    if (filters?.dateFrom) items = items.filter((i) => i.date >= filters.dateFrom!);
    if (filters?.dateTo) items = items.filter((i) => i.date <= filters.dateTo!);
    const total = items.length;
    const start = (pagination.page - 1) * pagination.limit;
    items = items.slice(start, start + pagination.limit);
    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  async create(inspection: InspectionEntity): Promise<InspectionEntity> {
    const id = randomUUID();
    const saved = InspectionEntity.fromPersistence({
      id,
      date: inspection.date,
      etatGeneral: inspection.etatGeneral,
      niveauReserve: inspection.niveauReserve,
      comportement: inspection.comportement,
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
    this.inspections.set(id, saved);
    return saved;
  }

  async update(id: string, data: Partial<InspectionEntity>): Promise<InspectionEntity> {
    const existing = this.inspections.get(id);
    if (!existing) throw new Error('Inspection not found');
    const updated = InspectionEntity.fromPersistence({
      id,
      date: (data as any).date ?? existing.date,
      etatGeneral: (data as any).etatGeneral ?? existing.etatGeneral,
      niveauReserve:
        (data as any).niveauReserve !== undefined
          ? (data as any).niveauReserve
          : existing.niveauReserve,
      comportement:
        (data as any).comportement !== undefined
          ? (data as any).comportement
          : existing.comportement,
      presenceReine:
        (data as any).presenceReine !== undefined
          ? (data as any).presenceReine
          : existing.presenceReine,
      nombreCadres:
        (data as any).nombreCadres !== undefined
          ? (data as any).nombreCadres
          : existing.nombreCadres,
      presenceMaladie:
        (data as any).presenceMaladie !== undefined
          ? (data as any).presenceMaladie
          : existing.presenceMaladie,
      descriptionMaladie:
        (data as any).descriptionMaladie !== undefined
          ? (data as any).descriptionMaladie
          : existing.descriptionMaladie,
      traitementApplique:
        (data as any).traitementApplique !== undefined
          ? (data as any).traitementApplique
          : existing.traitementApplique,
      recolteKg:
        (data as any).recolteKg !== undefined ? (data as any).recolteKg : existing.recolteKg,
      notes: (data as any).notes !== undefined ? (data as any).notes : existing.notes,
      rucheId: existing.rucheId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.inspections.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.inspections.delete(id);
  }

  reset(): void {
    this.inspections.clear();
  }
}
```

- [ ] Créer `test/e2e/auth.e2e-spec.ts` :

```typescript
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
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

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

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(409);

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

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(200);

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
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      const refreshToken = registerRes.body.data.tokens.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject an already-used refresh token (rotation)', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

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

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

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
```

##### Step 9.4 Verification Checklist

- [ ] `npm run test:e2e -- --testPathPattern=auth` passe
- [ ] Tous les scénarios auth sont couverts (register, login, refresh, logout, erreurs)

#### Step 9.4 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 9.5 : Tests E2E — CRUD Rucher, Ruche, Inspection

- [ ] Créer `test/e2e/rucher.e2e-spec.ts` :

```typescript
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
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'rucher@test.com', password: 'Password123!', nom: 'Test', prenom: 'User' });
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
```

- [ ] Créer `test/e2e/ruche.e2e-spec.ts` :

```typescript
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
    const authRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'ruche@test.com', password: 'Password123!', nom: 'Test', prenom: 'User' });
    accessToken = authRes.body.data.tokens.accessToken;

    // Create a rucher
    const rucherRes = await request(app.getHttpServer())
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
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Alpha', type: 'DADANT', statut: 'ACTIVE' })
        .expect(201);

      expect(res.body.data.nom).toBe('Ruche Alpha');
      expect(res.body.data.type).toBe('DADANT');
      expect(res.body.data.rucherId).toBe(rucherId);
    });

    it('should return 404 for unknown rucher', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ruchers/00000000-0000-0000-0000-000000000000/ruches')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Test' })
        .expect(404);
    });
  });

  describe('GET /api/v1/ruchers/:rucherId/ruches', () => {
    it('should list ruches with pagination', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Liste' });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/ruches/:id', () => {
    it('should get a ruche by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ruche Detail' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/ruches/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.nom).toBe('Ruche Detail');
    });
  });

  describe('PUT /api/v1/ruches/:id', () => {
    it('should update a ruche', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Ancien' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/v1/ruches/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'Nouveau', statut: 'INACTIVE' })
        .expect(200);

      expect(res.body.data.nom).toBe('Nouveau');
    });
  });

  describe('DELETE /api/v1/ruches/:id', () => {
    it('should delete a ruche', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/api/v1/ruchers/${rucherId}/ruches`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nom: 'A Supprimer' });

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/ruches/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
```

- [ ] Créer `test/e2e/inspection.e2e-spec.ts` :

```typescript
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

    // Register → create rucher → create ruche
    const authRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: 'inspection@test.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User',
    });
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
```

##### Step 9.5 Verification Checklist

- [ ] `npm run test:e2e` exécute les 4 fichiers E2E (auth, rucher, ruche, inspection)
- [ ] Tous les tests E2E passent au vert

#### Step 9.5 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 9.6 : Tests d'intégration — Repositories Prisma

> **Note :** Ces tests nécessitent une connexion à l'instance Prisma Postgres (`DATABASE_URL` valide). Ils sont ignorés automatiquement si la variable n'est pas configurée ou si la base n'est pas accessible.

- [ ] Créer `test/integration/repositories/prisma-user.repository.spec.ts` :

```typescript
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository';
import { UserEntity } from '@domain/user/entities/user.entity';
import { Role } from '@domain/enums';

const shouldRun =
  !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test:test@localhost');

(shouldRun ? describe : describe.skip)('PrismaUserRepository (integration)', () => {
  let prismaService: PrismaService;
  let repository: PrismaUserRepository;
  const testEmail = `integration-test-${Date.now()}@test.com`;

  beforeAll(async () => {
    prismaService = new PrismaService();
    await prismaService.onModuleInit();
    repository = new PrismaUserRepository(prismaService);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const user = await repository.findByEmail(testEmail);
      if (user) await repository.delete(user.id);
    } catch {
      /* ignore */
    }
    await prismaService.onModuleDestroy();
  });

  it('should create a user and find by email', async () => {
    const user = UserEntity.create({
      email: testEmail,
      password: '$2b$12$hashedPasswordPlaceholder1234567890',
      nom: 'Integration',
      prenom: 'Test',
    });

    const created = await repository.create(user);

    expect(created.id).toBeDefined();
    expect(created.id).not.toBe('');
    expect(created.email.toString()).toBe(testEmail);
    expect(created.nom).toBe('Integration');
    expect(created.role).toBe(Role.APICULTEUR);

    const found = await repository.findByEmail(testEmail);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it('should find a user by ID', async () => {
    const user = await repository.findByEmail(testEmail);
    expect(user).not.toBeNull();

    const found = await repository.findById(user!.id);
    expect(found).not.toBeNull();
    expect(found!.email.toString()).toBe(testEmail);
  });

  it('should return null for unknown email', async () => {
    const found = await repository.findByEmail('nonexistent@test.com');
    expect(found).toBeNull();
  });

  it('should return null for unknown ID', async () => {
    const found = await repository.findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });

  it('should delete a user', async () => {
    const user = await repository.findByEmail(testEmail);
    expect(user).not.toBeNull();

    await repository.delete(user!.id);

    const found = await repository.findByEmail(testEmail);
    expect(found).toBeNull();
  });
});
```

- [ ] Créer `test/integration/repositories/prisma-rucher.repository.spec.ts` :

```typescript
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository';
import { PrismaRucherRepository } from '@infrastructure/repositories/prisma-rucher.repository';
import { UserEntity } from '@domain/user/entities/user.entity';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';

const shouldRun =
  !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test:test@localhost');

(shouldRun ? describe : describe.skip)('PrismaRucherRepository (integration)', () => {
  let prismaService: PrismaService;
  let userRepository: PrismaUserRepository;
  let rucherRepository: PrismaRucherRepository;
  let testUserId: string;
  const testEmail = `rucher-integration-${Date.now()}@test.com`;

  beforeAll(async () => {
    prismaService = new PrismaService();
    await prismaService.onModuleInit();
    userRepository = new PrismaUserRepository(prismaService);
    rucherRepository = new PrismaRucherRepository(prismaService);

    // Create a test user
    const user = UserEntity.create({
      email: testEmail,
      password: '$2b$12$hashedPasswordPlaceholder1234567890',
      nom: 'RucherTest',
      prenom: 'Integration',
    });
    const savedUser = await userRepository.create(user);
    testUserId = savedUser.id;
  });

  afterAll(async () => {
    // Clean up: ruchers will be cascade-deleted with user
    try {
      await userRepository.delete(testUserId);
    } catch {
      /* ignore */
    }
    await prismaService.onModuleDestroy();
  });

  it('should create a rucher', async () => {
    const rucher = RucherEntity.create({
      nom: 'Rucher Integration',
      adresse: 'Adresse Test',
      userId: testUserId,
    });

    const created = await rucherRepository.create(rucher);

    expect(created.id).toBeDefined();
    expect(created.nom).toBe('Rucher Integration');
    expect(created.userId).toBe(testUserId);
  });

  it('should list ruchers by userId with pagination', async () => {
    const result = await rucherRepository.findAllByUserId(testUserId, { page: 1, limit: 10 });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('should search ruchers by name', async () => {
    const result = await rucherRepository.findAllByUserId(
      testUserId,
      { page: 1, limit: 10 },
      undefined,
      { search: 'Integration' },
    );

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items.every((r) => r.nom.includes('Integration'))).toBe(true);
  });

  it('should return empty for another user', async () => {
    const result = await rucherRepository.findAllByUserId('00000000-0000-0000-0000-000000000000', {
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should update a rucher', async () => {
    const list = await rucherRepository.findAllByUserId(testUserId, { page: 1, limit: 1 });
    const rucher = list.items[0];

    const updated = await rucherRepository.update(rucher.id, {
      nom: 'Rucher Modifié',
    } as Partial<RucherEntity>);

    expect(updated.nom).toBe('Rucher Modifié');
  });

  it('should delete a rucher', async () => {
    const rucher = RucherEntity.create({
      nom: 'A Supprimer',
      userId: testUserId,
    });
    const created = await rucherRepository.create(rucher);

    await rucherRepository.delete(created.id);

    const found = await rucherRepository.findById(created.id);
    expect(found).toBeNull();
  });
});
```

##### Step 9.6 Verification Checklist

- [ ] `npm run test:unit` — tous les tests unitaires passent
- [ ] `npm run test:e2e` — tous les tests E2E passent
- [ ] `npm run test:integration` — passe (ou skip si pas de DATABASE_URL)
- [ ] `npm run test:cov` — coverage ≥ 80% sur domain/application

#### Step 9.6 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
Commit message : `test: add unit, integration & e2e tests with Jest`
