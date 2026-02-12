## API Mellifera — Step 3 : Couche Domaine (implémentation)

## Goal

Fournir la mise en place complète de la couche domaine (entités, value objects, interfaces de repository, types partagés) en TypeScript pur, prête à être copiée dans `src/domain`.

## Prerequisites

- Assurez-vous d'être sur la branche `feat/api-mellifera-init`.

### Step-by-Step Instructions

#### Step 1: Ajouter les types partagés et constantes

- [ ] Créer `src/shared/types.ts`.

```typescript
// src/shared/types.ts
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type UUID = string;
```

- [ ] Créer `src/shared/constants.ts`.

```typescript
// src/shared/constants.ts
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export const EMAIL_MAX_LENGTH = 254;

export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
```

##### Step 1 Verification Checklist

- [ ] Les fichiers `src/shared/types.ts` et `src/shared/constants.ts` existent et exportent les symboles.

#### Step 2: Value Object — Email

- [ ] Créer `src/domain/user/value-objects/email.vo.ts`.

```typescript
// src/domain/user/value-objects/email.vo.ts
export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!Email.isValid(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this._value = value.trim().toLowerCase();
  }

  static isValid(value: string): boolean {
    if (!value) return false;
    if (value.length > 254) return false;
    // Simple but practical email regex
    // eslint-disable-next-line no-control-regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim());
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return other && this._value === other._value;
  }
}
```

##### Step 2 Verification Checklist

- [ ] Instanciation valide: `new Email('user@example.com')` fonctionne.
- [ ] Instanciation invalide: `new Email('not-an-email')` lance une erreur.

#### Step 3: Value Object — CoordonneesGps

- [ ] Créer `src/domain/rucher/value-objects/coordonnees-gps.vo.ts`.

```typescript
// src/domain/rucher/value-objects/coordonnees-gps.vo.ts
export class CoordonneesGps {
  private readonly _latitude: number;
  private readonly _longitude: number;

  constructor(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude}`);
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude}`);
    }
    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  toObject(): { latitude: number; longitude: number } {
    return { latitude: this._latitude, longitude: this._longitude };
  }

  equals(other: CoordonneesGps): boolean {
    return other && this._latitude === other._latitude && this._longitude === other._longitude;
  }
}
```

##### Step 3 Verification Checklist

- [ ] Instanciation valide: `new CoordonneesGps(48.8566, 2.3522)` fonctionne.
- [ ] Instanciation invalide: latitude hors bornes lance une erreur.

#### Step 4: Entité `User`

- [ ] Créer `src/domain/user/entities/user.entity.ts`.

```typescript
// src/domain/user/entities/user.entity.ts
import { Email } from '../value-objects/email.vo';

export class User {
  public readonly id: string;
  public readonly email: Email;
  private _passwordHash?: string;
  public readonly role: string;
  public readonly createdAt: Date;
  public updatedAt?: Date;

  constructor(params: {
    id: string;
    email: Email;
    passwordHash?: string;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date | null;
  }) {
    this.id = params.id;
    this.email = params.email;
    this._passwordHash = params.passwordHash;
    this.role = params.role ?? 'USER';
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? undefined;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  setPasswordHash(hash: string) {
    this._passwordHash = hash;
    this.touch();
  }

  touch() {
    this.updatedAt = new Date();
  }
}
```

##### Step 4 Verification Checklist

- [ ] Créer une instance `new User({ id: 'u1', email: new Email('a@b.com') })`.

#### Step 5: Entité `Rucher`

- [ ] Créer `src/domain/rucher/entities/rucher.entity.ts`.

```typescript
// src/domain/rucher/entities/rucher.entity.ts
import { CoordonneesGps } from '../value-objects/coordonnees-gps.vo';

export class Rucher {
  public readonly id: string;
  public readonly ownerId: string;
  public name: string;
  public location?: CoordonneesGps;
  public readonly createdAt: Date;
  public updatedAt?: Date;

  constructor(params: {
    id: string;
    ownerId: string;
    name: string;
    location?: CoordonneesGps | null;
    createdAt?: Date;
    updatedAt?: Date | null;
  }) {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Rucher name must be provided');
    }
    this.id = params.id;
    this.ownerId = params.ownerId;
    this.name = params.name.trim();
    this.location = params.location ?? undefined;
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? undefined;
  }

  rename(newName: string) {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Rucher name must be provided');
    }
    this.name = newName.trim();
    this.touch();
  }

  setLocation(location: CoordonneesGps) {
    this.location = location;
    this.touch();
  }

  touch() {
    this.updatedAt = new Date();
  }
}
```

##### Step 5 Verification Checklist

- [ ] Instance `new Rucher({ id: 'r1', ownerId: 'u1', name: 'Mon Rucher' })`.

#### Step 6: Entité `Ruche`

- [ ] Créer `src/domain/ruche/entities/ruche.entity.ts`.

```typescript
// src/domain/ruche/entities/ruche.entity.ts

export type TypeRuche = 'DADANT' | 'LANGSTROTH' | 'NUCLEUS' | 'OTHER';
export type StatutRuche = 'ACTIVE' | 'INACTIVE' | 'LOST';

export class Ruche {
  public readonly id: string;
  public readonly rucherId: string;
  public name?: string;
  public type: TypeRuche;
  public statut: StatutRuche;
  public readonly createdAt: Date;
  public updatedAt?: Date;

  constructor(params: {
    id: string;
    rucherId: string;
    name?: string | null;
    type?: TypeRuche;
    statut?: StatutRuche;
    createdAt?: Date;
    updatedAt?: Date | null;
  }) {
    this.id = params.id;
    this.rucherId = params.rucherId;
    this.name = params.name ?? undefined;
    this.type = params.type ?? 'OTHER';
    this.statut = params.statut ?? 'ACTIVE';
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? undefined;
  }

  setStatus(statut: StatutRuche) {
    this.statut = statut;
    this.touch();
  }

  touch() {
    this.updatedAt = new Date();
  }
}
```

##### Step 6 Verification Checklist

- [ ] Instance `new Ruche({ id: 'h1', rucherId: 'r1' })` fonctionne.

#### Step 7: Entité `Inspection`

- [ ] Créer `src/domain/inspection/entities/inspection.entity.ts`.

```typescript
// src/domain/inspection/entities/inspection.entity.ts

export type EtatGeneral = 'BON' | 'MOYEN' | 'MAUVAIS';

export class Inspection {
  public readonly id: string;
  public readonly rucheId: string;
  public date: Date;
  public etatGeneral: EtatGeneral;
  public notes?: string;
  public readonly createdAt: Date;
  public updatedAt?: Date;

  constructor(params: {
    id: string;
    rucheId: string;
    date: Date | string;
    etatGeneral?: EtatGeneral;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date | null;
  }) {
    this.id = params.id;
    this.rucheId = params.rucheId;
    this.date = params.date instanceof Date ? params.date : new Date(params.date);
    this.etatGeneral = params.etatGeneral ?? 'BON';
    this.notes = params.notes ?? undefined;
    this.createdAt = params.createdAt ?? new Date();
    this.updatedAt = params.updatedAt ?? undefined;
  }

  updateEtat(etat: EtatGeneral, notes?: string) {
    this.etatGeneral = etat;
    if (notes !== undefined) this.notes = notes;
    this.touch();
  }

  touch() {
    this.updatedAt = new Date();
  }
}
```

##### Step 7 Verification Checklist

- [ ] Instance `new Inspection({ id: 'i1', rucheId: 'h1', date: new Date() })` fonctionne.

#### Step 8: Repository Interfaces (abstract classes)

- [ ] Créer `src/domain/user/repositories/user.repository.interface.ts`.

```typescript
// src/domain/user/repositories/user.repository.interface.ts
import { User } from '../../user/entities/user.entity';
import { PaginatedResult, PaginationParams } from '../../../shared/types';

export abstract class UserRepository {
  abstract create(user: User): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract update(user: User): Promise<User>;
  abstract delete(id: string): Promise<void>;
  abstract findAll(pagination?: PaginationParams): Promise<PaginatedResult<User>>;
}
```

- [ ] Créer `src/domain/rucher/repositories/rucher.repository.interface.ts`.

```typescript
// src/domain/rucher/repositories/rucher.repository.interface.ts
import { Rucher } from '../entities/rucher.entity';
import { PaginatedResult, PaginationParams } from '../../../shared/types';

export abstract class RucherRepository {
  abstract create(rucher: Rucher): Promise<Rucher>;
  abstract findById(id: string): Promise<Rucher | null>;
  abstract update(rucher: Rucher): Promise<Rucher>;
  abstract delete(id: string): Promise<void>;
  abstract findAllByOwner(
    ownerId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<Rucher>>;
}
```

- [ ] Créer `src/domain/ruche/repositories/ruche.repository.interface.ts`.

```typescript
// src/domain/ruche/repositories/ruche.repository.interface.ts
import { Ruche } from '../entities/ruche.entity';
import { PaginatedResult, PaginationParams } from '../../../shared/types';

export abstract class RucheRepository {
  abstract create(ruche: Ruche): Promise<Ruche>;
  abstract findById(id: string): Promise<Ruche | null>;
  abstract update(ruche: Ruche): Promise<Ruche>;
  abstract delete(id: string): Promise<void>;
  abstract findAllByRucher(
    rucherId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<Ruche>>;
}
```

- [ ] Créer `src/domain/inspection/repositories/inspection.repository.interface.ts`.

```typescript
// src/domain/inspection/repositories/inspection.repository.interface.ts
import { Inspection } from '../entities/inspection.entity';
import { PaginatedResult, PaginationParams } from '../../../shared/types';

export abstract class InspectionRepository {
  abstract create(inspection: Inspection): Promise<Inspection>;
  abstract findById(id: string): Promise<Inspection | null>;
  abstract update(inspection: Inspection): Promise<Inspection>;
  abstract delete(id: string): Promise<void>;
  abstract findAllByRuche(
    rucheId: string,
    pagination?: PaginationParams,
    filters?: Record<string, unknown>,
  ): Promise<PaginatedResult<Inspection>>;
}
```

##### Step 8 Verification Checklist

- [ ] Chaque fichier d'interface est présent et exporte une `abstract class`.

#### Step 9: Export barrels (optionnel mais recommandé)

- [ ] Ajouter des fichiers `index.ts` pour ré-exporter les éléments si vous le souhaitez. Exemple minimal à copier dans chaque dossier :

```typescript
// src/domain/user/index.ts
export * from './entities/user.entity';
export * from './value-objects/email.vo';
export * from './repositories/user.repository.interface';

// src/domain/rucher/index.ts
export * from './entities/rucher.entity';
export * from './value-objects/coordonnees-gps.vo';
export * from './repositories/rucher.repository.interface';

// src/domain/ruche/index.ts
export * from './entities/ruche.entity';
export * from './repositories/ruche.repository.interface';

// src/domain/inspection/index.ts
export * from './entities/inspection.entity';
export * from './repositories/inspection.repository.interface';

// src/shared/index.ts
export * from '../shared/types';
export * from '../shared/constants';
```

##### Step 9 Verification Checklist

- [ ] Les `index.ts` (barrels) exposent les symboles pour `@domain/*` usage.

#### Step 10: STOP & COMMIT

**STOP & COMMIT:** Arrêtez ici, copiez les fichiers dans le projet (`src/...`) et effectuez un commit. Après vérification locale (compilation TypeScript), revenez pour la suite (repositories infra / handlers).

---

## Tests & vérifications recommandées (commande locale)

1. Copier les fichiers dans `src/` comme indiqué.
2. Lancer la compilation TypeScript :

```bash
npm run build
```

3. Vérifier des exemples rapides dans un REPL TypeScript ou un petit script :

```ts
import { Email } from './src/domain/user/value-objects/email.vo';
const e = new Email('dev@example.com');
console.log(e.toString());
```

4. Une fois validé, commit :

```bash
git add src/domain src/shared
git commit -m "feat(domain): add entities, value objects and repository interfaces (step 3)"
git push --set-upstream origin feat/api-mellifera-init
```

## Remarques finales

- Le code de la couche domaine est volontairement indépendant de Nest et de Prisma (aucune importation). L'adaptation entre la couche infrastructure (Prisma) et la couche domaine doit se faire via des mappers dans `src/infrastructure/repositories/*`.
- Si vous souhaitez, je peux ensuite générer les adapters Prisma pour ces interfaces (Step 5).

# API Mellifera — Step 1 : Initialisation du projet NestJS & configuration de base

## Goal

Initialiser le projet NestJS avec TypeScript strict, installer toutes les dépendances nécessaires, configurer les fichiers de base (`.gitignore`, `.env.example`, ESLint, Prettier), et vérifier que le serveur démarre correctement.

## Prerequisites

L'utilisateur doit être sur la branche `feat/api-mellifera-init` avant de commencer.
Si la branche n'existe pas, la créer depuis `main`.

---

### Step-by-Step Instructions

#### Step 1.1 : Créer la branche et initialiser le projet NestJS

- [x] Créer la branche `feat/api-mellifera-init` depuis `main` :

```bash
cd /Users/demha/Projets/perso/api-mellifera
git checkout -b feat/api-mellifera-init
```

- [x] Initialiser le projet NestJS dans le répertoire courant (sans créer de sous-dossier) :

```bash
npx @nestjs/cli@11.0.16 new . --package-manager npm --skip-git --strict
```

> **Note :** `--skip-git` car le repo Git existe déjà. `--strict` active le mode TypeScript strict. Le `.` indique d'installer dans le dossier courant.

##### Step 1.1 Verification Checklist

- [x] La branche `feat/api-mellifera-init` est active (`git branch --show-current`)
- [x] Les fichiers `package.json`, `tsconfig.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts` existent
- [x] `node_modules/` est présent
- [x] `npm run build` compile sans erreur

---

#### Step 1.2 : Installer toutes les dépendances du projet

- [x] Installer les dépendances de production :

```bash
npm install @nestjs/config@^4.0.3 @nestjs/swagger@^11.2.6 @nestjs/passport@^11.0.5 @nestjs/jwt@^11.0.2 @nestjs/cqrs@^11.0.3 @prisma/client@^7.3.0 passport@^0.7.0 passport-jwt@^4.0.1 bcrypt@^6.0.0 class-validator@^0.14.3 class-transformer@^0.5.1 joi@^18.0.2
```

- [x] Installer les dépendances de développement :

```bash
npm install --save-dev prisma@^7.3.0 @types/passport-jwt@^4.0.1 @types/bcrypt@^6.0.0 @types/supertest@^6.0.3
```

##### Step 1.2 Verification Checklist

- [x] `npm ls @nestjs/config` affiche la version installée
- [x] `npm ls @prisma/client` affiche la version installée
- [x] `npm ls bcrypt` affiche la version installée
- [x] `npm run build` compile toujours sans erreur

---

#### Step 1.3 : Configurer le `.gitignore`

- [ ] Remplacer le contenu de `.gitignore` par le fichier suivant :

```gitignore
# compiled output
/dist
/node_modules
/build

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# dotenv environment files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# Prisma
prisma/migrations/**/migration_lock.toml

# temp files
*.swp
*.swo
*~
```

##### Step 1.3 Verification Checklist

- [x] Le fichier `.gitignore` existe et contient les entrées pour `.env`, `node_modules`, `dist`, `prisma`

---

#### Step 1.4 : Créer le fichier `.env.example`

- [x] Créer le fichier `.env.example` à la racine du projet :

```dotenv
# ============================================
# API Mellifera — Variables d'environnement
# ============================================

# Port du serveur
PORT=3000

# Base de données — Prisma Postgres (instance hébergée)
# Récupérer l'URL depuis https://console.prisma.io
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# JWT — Access Token
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_ACCESS_EXPIRATION="15m"

# JWT — Refresh Token
JWT_REFRESH_EXPIRATION="7d"
```

##### Step 1.4 Verification Checklist

- [x] Le fichier `.env.example` existe à la racine
- [x] Il contient les 5 variables : `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`

---

#### Step 1.5 : Configurer ESLint

- [x] Remplacer le contenu de `.eslintrc.js` par :

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
  },
};
```

##### Step 1.5 Verification Checklist

- [x] Le fichier `.eslintrc.js` existe
- [x] Les règles TypeScript strictes sont présentes

---

#### Step 1.6 : Configurer Prettier

- [x] Remplacer le contenu de `.prettierrc` par :

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

##### Step 1.6 Verification Checklist

- [x] Le fichier `.prettierrc` existe avec les bonnes options

---

#### Step 1.7 : Configurer `tsconfig.json` en mode strict

- [x] Remplacer le contenu de `tsconfig.json` par :

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@interfaces/*": ["src/interfaces/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

- [x] Remplacer le contenu de `tsconfig.build.json` par :

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

##### Step 1.7 Verification Checklist

- [x] `tsconfig.json` contient `"strict": true` et les `paths` pour l'architecture Clean
- [x] `tsconfig.build.json` existe et étend `tsconfig.json`
- [x] `npm run build` compile sans erreur

---

#### Step 1.8 : Configurer `nest-cli.json`

- [x] Remplacer le contenu de `nest-cli.json` par :

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

##### Step 1.8 Verification Checklist

- [ ] `nest-cli.json` contient le plugin Swagger

---

#### Step 1.9 : Mettre à jour `src/main.ts`

- [ ] Remplacer le contenu de `src/main.ts` par :

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

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

##### Step 1.9 Verification Checklist

- [ ] `src/main.ts` contient la configuration Swagger, le `ValidationPipe`, le prefix `api/v1`, et CORS

---

#### Step 1.10 : Mettre à jour `src/app.module.ts`

- [ ] Remplacer le contenu de `src/app.module.ts` par :

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

##### Step 1.10 Verification Checklist

- [ ] `src/app.module.ts` importe `ConfigModule.forRoot()` en global
- [ ] Le fichier ne contient plus `AppController` ni `AppService`

---

#### Step 1.11 : Supprimer les fichiers générés inutiles

- [ ] Supprimer les fichiers suivants générés par `nest new` qui ne sont plus nécessaires :

```bash
rm -f src/app.controller.ts src/app.controller.spec.ts src/app.service.ts
```

##### Step 1.11 Verification Checklist

- [ ] `src/app.controller.ts`, `src/app.controller.spec.ts`, `src/app.service.ts` n'existent plus

---

#### Step 1.12 : Vérification finale

- [ ] Compiler le projet :

```bash
npm run build
```

- [ ] Démarrer le serveur en mode développement :

```bash
npm run start:dev
```

- [ ] Vérifier que le serveur démarre sans erreur sur le port 3000
- [ ] Accéder à `http://localhost:3000/api` — la page Swagger UI doit s'afficher (vide, sans endpoints)
- [ ] Arrêter le serveur (`Ctrl+C`)

##### Step 1.12 Verification Checklist

- [ ] `npm run build` — aucune erreur de compilation
- [ ] `npm run start:dev` — le serveur démarre et log :
  - `🐝 API Mellifera is running on: http://localhost:3000`
  - `📚 Swagger UI available at: http://localhost:3000/api`
- [ ] `http://localhost:3000/api` affiche l'interface Swagger UI avec le titre "API Mellifera"
- [ ] Aucun fichier inutile (`app.controller.ts`, `app.service.ts`) ne traîne

---

#### Step 1 STOP & COMMIT

**STOP & COMMIT:** L'agent doit s'arrêter ici et attendre que l'utilisateur teste, stage et commit le changement.

```bash
git add .
git commit -m "chore: init NestJS project with dependencies"
```

---

## Résumé des fichiers créés/modifiés

| Fichier                      | Action                                           |
| ---------------------------- | ------------------------------------------------ |
| `package.json`               | Généré par `nest new` + dépendances ajoutées     |
| `tsconfig.json`              | Modifié — mode strict + paths Clean Architecture |
| `tsconfig.build.json`        | Modifié — exclude test/dist                      |
| `nest-cli.json`              | Modifié — plugin Swagger                         |
| `.gitignore`                 | Remplacé — complet pour NestJS + Prisma          |
| `.env.example`               | Créé — variables DB, JWT, PORT                   |
| `.eslintrc.js`               | Modifié — règles TypeScript strictes             |
| `.prettierrc`                | Modifié — options formatage                      |
| `src/main.ts`                | Modifié — Swagger, ValidationPipe, CORS, prefix  |
| `src/app.module.ts`          | Modifié — ConfigModule global                    |
| `src/app.controller.ts`      | Supprimé                                         |
| `src/app.controller.spec.ts` | Supprimé                                         |
| `src/app.service.ts`         | Supprimé                                         |

## Dépendances installées

### Production

`@nestjs/config`, `@nestjs/swagger`, `@nestjs/passport`, `@nestjs/jwt`, `@nestjs/cqrs`, `@prisma/client`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `joi`

### Développement

`prisma`, `@types/passport-jwt`, `@types/bcrypt`, `@types/supertest`
