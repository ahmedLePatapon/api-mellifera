# API Mellifera — Step 2 : Schéma Prisma & configuration base de données

## Goal
Initialiser Prisma avec le schéma complet de la base de données (User, Rucher, Ruche, Inspection, RefreshToken), créer le PrismaService/PrismaModule global, et configurer la validation des variables d'environnement avec Joi.

## Prerequisites
L'utilisateur doit être sur la branche `feat/api-mellifera-init` avant de commencer.
Si la branche n'existe pas, la créer depuis `main`.

```bash
git checkout feat/api-mellifera-init
```

L'utilisateur doit disposer d'une instance **Prisma Postgres** (via [console.prisma.io](https://console.prisma.io)) et avoir copié sa `DATABASE_URL` dans un fichier `.env` à la racine du projet.

```bash
cp .env.example .env
# Puis éditer .env et remplacer DATABASE_URL par la vraie URL Prisma Postgres
```

---

### Step-by-Step Instructions

#### Step 2.1 : Initialiser Prisma et créer le schéma complet

- [x] Initialiser Prisma (crée le dossier `prisma/` et le fichier `schema.prisma`) :

```bash
npx prisma init --datasource-provider postgresql
```

> **Note :** Si le fichier `prisma/schema.prisma` est créé avec un contenu par défaut, on le remplacera intégralement à l'étape suivante. Si un fichier `.env` est généré par `prisma init`, il sera fusionné/écrasé par le `.env` existant.

- [x] Remplacer **intégralement** le contenu de `prisma/schema.prisma` par le code suivant :

```prisma
// ============================================
// API Mellifera — Schéma Prisma
// ============================================

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Enums
// ============================================

enum Role {
  APICULTEUR
  ADMIN

  @@map("roles")
}

enum TypeRuche {
  DADANT
  LANGSTROTH
  WARRE
  VOIRNOT
  KENYANE
  AUTRE

  @@map("types_ruche")
}

enum StatutRuche {
  ACTIVE
  INACTIVE
  MORTE
  VENDUE
  ESSAIMEE

  @@map("statuts_ruche")
}

enum EtatGeneral {
  EXCELLENT
  BON
  MOYEN
  FAIBLE
  CRITIQUE

  @@map("etats_general")
}

enum NiveauReserve {
  ABONDANT
  SUFFISANT
  FAIBLE
  VIDE

  @@map("niveaux_reserve")
}

enum Comportement {
  CALME
  AGITE
  AGRESSIF
  NORMAL

  @@map("comportements")
}

// ============================================
// Models
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  nom       String
  prenom    String
  role      Role     @default(APICULTEUR)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  ruchers       Rucher[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model Rucher {
  id          String   @id @default(uuid())
  nom         String
  adresse     String?
  latitude    Float?
  longitude   Float?
  description String?
  userId      String   @map("user_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  ruches Ruche[]

  @@index([userId])
  @@map("ruchers")
}

model Ruche {
  id        String      @id @default(uuid())
  nom       String
  type      TypeRuche   @default(DADANT)
  statut    StatutRuche @default(ACTIVE)
  dateAchat DateTime?   @map("date_achat")
  notes     String?
  rucherId  String      @map("rucher_id")
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")

  rucher      Rucher       @relation(fields: [rucherId], references: [id], onDelete: Cascade)
  inspections Inspection[]

  @@index([rucherId])
  @@map("ruches")
}

model Inspection {
  id               String         @id @default(uuid())
  date             DateTime
  etatGeneral      EtatGeneral    @map("etat_general")
  niveauReserve    NiveauReserve? @map("niveau_reserve")
  comportement     Comportement?
  presenceReine    Boolean?       @map("presence_reine")
  nombreCadres     Int?           @map("nombre_cadres")
  presenceMaladie  Boolean?       @default(false) @map("presence_maladie")
  descriptionMaladie String?      @map("description_maladie")
  traitementApplique String?      @map("traitement_applique")
  recolteKg        Float?         @map("recolte_kg")
  notes            String?
  rucheId          String         @map("ruche_id")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  ruche Ruche @relation(fields: [rucheId], references: [id], onDelete: Cascade)

  @@index([rucheId])
  @@index([date])
  @@map("inspections")
}

model RefreshToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String    @map("user_id")
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

##### Step 2.1 Verification Checklist
- [x] Le fichier `prisma/schema.prisma` existe avec le contenu ci-dessus
- [x] Valider le schéma :

```bash
npx prisma validate
```

- [x] La commande affiche `The schema at prisma/schema.prisma is valid 🚀`

---

#### Step 2.2 : Ajouter `src/generated` au `.gitignore` et mettre à jour `tsconfig.json`

- [x] Ajouter la ligne suivante dans `.gitignore` (après la section `# Prisma`) :
```gitignore
# Prisma
prisma/migrations/**/migration_lock.toml
src/generated
```

> **Explication :** Le dossier `src/generated/prisma` est généré par `npx prisma generate` et ne doit pas être versionné.

- [x] Mettre à jour `tsconfig.json` pour ajouter le path alias `@generated/*` **et** exclure le dossier `src/generated` de la compilation. Remplacer le contenu complet de `tsconfig.json` par :

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
            "@domain/*": [
                "src/domain/*"
            ],
            "@application/*": [
                "src/application/*"
            ],
            "@infrastructure/*": [
                "src/infrastructure/*"
            ],
            "@interfaces/*": [
                "src/interfaces/*"
            ],
            "@shared/*": [
                "src/shared/*"
            ],
            "@config/*": [
                "src/config/*"
            ],
            "@generated/*": [
                "src/generated/*"
            ]
        }
    },
    "exclude": [
        "node_modules",
        "dist",
        "src/generated"
    ]
}
```

##### Step 2.2 Verification Checklist
- [x] `.gitignore` contient `src/generated`
- [x] `tsconfig.json` contient le path alias `@generated/*` → `src/generated/*`
- [x] `tsconfig.json` contient `"exclude": ["node_modules", "dist", "src/generated"]`

---

#### Step 2.3 : Créer le PrismaService

- [x] Créer le fichier `src/infrastructure/prisma/prisma.service.ts` :

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit(): Promise<void> {
        this.logger.log('Connecting to database...');
        await this.$connect();
        this.logger.log('Database connected successfully');
    }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('Disconnecting from database...');
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
}
```

##### Step 2.3 Verification Checklist
- [x] Le fichier `src/infrastructure/prisma/prisma.service.ts` existe
- [x] `PrismaService` étend `PrismaClient` et implémente `OnModuleInit` + `OnModuleDestroy`

---

#### Step 2.4 : Créer le PrismaModule (global)

- [x] Créer le fichier `src/infrastructure/prisma/prisma.module.ts` :

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}
```

##### Step 2.4 Verification Checklist
- [x] Le fichier `src/infrastructure/prisma/prisma.module.ts` existe
- [x] Le module est décoré avec `@Global()` pour être disponible partout sans re-import

---

#### Step 2.5 : Créer la validation des variables d'environnement avec Joi

- [x] Créer le fichier `src/config/env.validation.ts` :

```typescript
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required().messages({
        'string.empty': 'DATABASE_URL is required. Get it from https://console.prisma.io',
        'any.required': 'DATABASE_URL is required. Get it from https://console.prisma.io',
    }),
    JWT_SECRET: Joi.string().required().min(16).messages({
        'string.empty': 'JWT_SECRET is required and must be at least 16 characters',
        'string.min': 'JWT_SECRET must be at least 16 characters long',
        'any.required': 'JWT_SECRET is required',
    }),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
});
```

##### Step 2.5 Verification Checklist
- [x] Le fichier `src/config/env.validation.ts` existe
- [x] La validation Joi couvre les 5 variables d'environnement (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`)

---

#### Step 2.6 : Créer le fichier de configuration typée

- [x] Créer le fichier `src/config/configuration.ts` :

```typescript
export interface AppConfig {
    port: number;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        accessExpiration: string;
        refreshExpiration: string;
    };
}

export default (): AppConfig => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
        url: process.env.DATABASE_URL ?? '',
    },
    jwt: {
        secret: process.env.JWT_SECRET ?? '',
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
    },
});
```

##### Step 2.6 Verification Checklist
- [x] Le fichier `src/config/configuration.ts` existe
- [x] L'interface `AppConfig` est exportée et typée correctement
- [x] La fonction `default` retourne la configuration structurée

---

#### Step 2.7 : Créer le ConfigModule personnalisé

- [x] Créer le fichier `src/config/config.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { envValidationSchema } from './env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [configuration],
            validationSchema: envValidationSchema,
            validationOptions: {
                abortEarly: true,
                allowUnknown: true,
            },
        }),
    ],
})
export class AppConfigModule {}
```

##### Step 2.7 Verification Checklist
- [x] Le fichier `src/config/config.module.ts` existe
- [x] `ConfigModule.forRoot()` utilise `load: [configuration]` et `validationSchema: envValidationSchema`

---

#### Step 2.8 : Mettre à jour `src/app.module.ts`

- [x] Remplacer le contenu de `src/app.module.ts` par :

```typescript
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
    imports: [AppConfigModule, PrismaModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
```

##### Step 2.8 Verification Checklist
- [x] `src/app.module.ts` importe `AppConfigModule` et `PrismaModule`
- [x] L'ancien `ConfigModule.forRoot()` inline est remplacé par `AppConfigModule`

---

#### Step 2.9 : Générer le client Prisma et appliquer la migration

- [ ] Générer le client Prisma :

```bash
npx prisma generate
```

- [ ] Vérifier que le dossier `src/generated/prisma/` a été créé

- [ ] Compiler le projet pour vérifier qu'il n'y a pas d'erreurs TypeScript :

```bash
npm run build
```

- [ ] Appliquer la migration initiale vers la base de données Prisma Postgres :

```bash
npx prisma migrate dev --name init
```

> Note: `npx prisma generate` et `npm run build` ont été exécutés avec succès.
> La commande `npx prisma migrate dev --name init` n'a pas pu être appliquée automatiquement depuis cet agent — elle nécessite une `DATABASE_URL` valide dans `.env` et une exécution locale si vous le souhaitez. Voir la suite pour détails.

> **Note :** Cette commande nécessite une `DATABASE_URL` valide dans le fichier `.env` pointant vers l'instance Prisma Postgres hébergée. Si la commande échoue avec une erreur de connexion, vérifier que l'URL est correcte dans le fichier `.env`.

##### Step 2.9 Verification Checklist
- [ ] `npx prisma generate` s'exécute sans erreur
- [ ] Le dossier `src/generated/prisma/` existe et contient les fichiers générés
- [ ] `npm run build` compile sans erreur (0 erreur TypeScript)
- [ ] `npx prisma migrate dev --name init` crée la migration `prisma/migrations/XXXXXXXX_init/migration.sql`
- [ ] La migration SQL contient les tables `users`, `ruchers`, `ruches`, `inspections`, `refresh_tokens`
- [x] `npx prisma generate` s'exécute sans erreur
- [x] Le dossier `src/generated/prisma/` existe et contient les fichiers générés
- [x] `npm run build` compile sans erreur (0 erreur TypeScript)
- [ ] `npx prisma migrate dev --name init` crée la migration `prisma/migrations/XXXXXXXX_init/migration.sql`
- [ ] La migration SQL contient les tables `users`, `ruchers`, `ruches`, `inspections`, `refresh_tokens`

---

#### Step 2.10 : Vérification finale

- [ ] Démarrer le serveur en mode développement :

```bash
npm run start:dev
```

- [ ] Vérifier dans les logs du serveur que :
  - Le message `Connecting to database...` apparaît
  - Le message `Database connected successfully` apparaît
  - Le serveur démarre sans erreur sur le port 3000

- [ ] Arrêter le serveur (`Ctrl+C`)

- [ ] (Optionnel) Ouvrir Prisma Studio pour visualiser les tables :

```bash
npx prisma studio
```

- [ ] Vérifier que les 5 tables apparaissent : `users`, `ruchers`, `ruches`, `inspections`, `refresh_tokens`

##### Step 2.10 Verification Checklist
- [ ] `npm run start:dev` démarre sans erreur
- [ ] Les logs confirment la connexion à la base de données
- [ ] `npx prisma studio` affiche les 5 tables (si testé)
- [ ] Aucune erreur de compilation, aucune erreur runtime

---

#### Step 2 STOP & COMMIT

**STOP & COMMIT:** L'agent doit s'arrêter ici et attendre que l'utilisateur teste, stage et commit le changement.

```bash
git add .
git commit -m "feat: add Prisma schema and database config"
```

---

## Résumé des fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | Créé — schéma complet avec 5 models + 6 enums |
| `src/generated/prisma/` | Généré — client Prisma (non versionné) |
| `src/infrastructure/prisma/prisma.service.ts` | Créé — PrismaService (extends PrismaClient) |
| `src/infrastructure/prisma/prisma.module.ts` | Créé — PrismaModule (@Global) |
| `src/config/env.validation.ts` | Créé — validation Joi des variables d'env |
| `src/config/configuration.ts` | Créé — configuration typée (AppConfig) |
| `src/config/config.module.ts` | Créé — AppConfigModule avec validation |
| `src/app.module.ts` | Modifié — importe AppConfigModule + PrismaModule |
| `.gitignore` | Modifié — ajout de `src/generated` |
| `tsconfig.json` | Modifié — ajout path alias `@generated/*` + exclude |
| `prisma/migrations/` | Généré — migration initiale `init` |

## Architecture des modèles

```
User (users)
├── id: UUID (PK)
├── email: String (unique)
├── password: String
├── nom: String
├── prenom: String
├── role: Role (APICULTEUR | ADMIN)
├── createdAt / updatedAt
├── → Rucher[] (cascade delete)
└── → RefreshToken[] (cascade delete)

Rucher (ruchers)
├── id: UUID (PK)
├── nom: String
├── adresse: String?
├── latitude/longitude: Float?
├── description: String?
├── userId: FK → User
├── createdAt / updatedAt
└── → Ruche[] (cascade delete)

Ruche (ruches)
├── id: UUID (PK)
├── nom: String
├── type: TypeRuche (DADANT | LANGSTROTH | ...)
├── statut: StatutRuche (ACTIVE | INACTIVE | ...)
├── dateAchat: DateTime?
├── notes: String?
├── rucherId: FK → Rucher
├── createdAt / updatedAt
└── → Inspection[] (cascade delete)

Inspection (inspections)
├── id: UUID (PK)
├── date: DateTime
├── etatGeneral: EtatGeneral
├── niveauReserve: NiveauReserve?
├── comportement: Comportement?
├── presenceReine: Boolean?
├── nombreCadres: Int?
├── presenceMaladie: Boolean? (default false)
├── descriptionMaladie: String?
├── traitementApplique: String?
├── recolteKg: Float?
├── notes: String?
├── rucheId: FK → Ruche
└── createdAt / updatedAt

RefreshToken (refresh_tokens)
├── id: UUID (PK)
├── token: String (unique, hashé)
├── userId: FK → User
├── expiresAt: DateTime
├── revokedAt: DateTime?
└── createdAt
```
