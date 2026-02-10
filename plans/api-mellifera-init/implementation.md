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
- [ ] Le fichier `.gitignore` existe et contient les entrées pour `.env`, `node_modules`, `dist`, `prisma`

---

#### Step 1.4 : Créer le fichier `.env.example`

- [ ] Créer le fichier `.env.example` à la racine du projet :

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
- [ ] Le fichier `.env.example` existe à la racine
- [ ] Il contient les 5 variables : `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`

---

#### Step 1.5 : Configurer ESLint

- [ ] Remplacer le contenu de `.eslintrc.js` par :

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
- [ ] Le fichier `.eslintrc.js` existe
- [ ] Les règles TypeScript strictes sont présentes

---

#### Step 1.6 : Configurer Prettier

- [ ] Remplacer le contenu de `.prettierrc` par :

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
- [ ] Le fichier `.prettierrc` existe avec les bonnes options

---

#### Step 1.7 : Configurer `tsconfig.json` en mode strict

- [ ] Remplacer le contenu de `tsconfig.json` par :

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

- [ ] Remplacer le contenu de `tsconfig.build.json` par :

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "test",
    "dist",
    "**/*spec.ts"
  ]
}
```

##### Step 1.7 Verification Checklist
- [ ] `tsconfig.json` contient `"strict": true` et les `paths` pour l'architecture Clean
- [ ] `tsconfig.build.json` existe et étend `tsconfig.json`
- [ ] `npm run build` compile sans erreur

---

#### Step 1.8 : Configurer `nest-cli.json`

- [ ] Remplacer le contenu de `nest-cli.json` par :

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

| Fichier | Action |
|---------|--------|
| `package.json` | Généré par `nest new` + dépendances ajoutées |
| `tsconfig.json` | Modifié — mode strict + paths Clean Architecture |
| `tsconfig.build.json` | Modifié — exclude test/dist |
| `nest-cli.json` | Modifié — plugin Swagger |
| `.gitignore` | Remplacé — complet pour NestJS + Prisma |
| `.env.example` | Créé — variables DB, JWT, PORT |
| `.eslintrc.js` | Modifié — règles TypeScript strictes |
| `.prettierrc` | Modifié — options formatage |
| `src/main.ts` | Modifié — Swagger, ValidationPipe, CORS, prefix |
| `src/app.module.ts` | Modifié — ConfigModule global |
| `src/app.controller.ts` | Supprimé |
| `src/app.controller.spec.ts` | Supprimé |
| `src/app.service.ts` | Supprimé |

## Dépendances installées

### Production
`@nestjs/config`, `@nestjs/swagger`, `@nestjs/passport`, `@nestjs/jwt`, `@nestjs/cqrs`, `@prisma/client`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `joi`

### Développement
`prisma`, `@types/passport-jwt`, `@types/bcrypt`, `@types/supertest`
