# API Mellifera — Plan d'implémentation complet

**Branch:** `feat/api-mellifera-init`
**Description:** Initialisation complète de l'API NestJS de gestion apicole avec Clean Architecture, DDD léger, Prisma Postgres (hébergé), authentification JWT avec refresh tokens, pagination/filtrage, et documentation Swagger.

## Goal

Construire une API REST complète de gestion apicole (ruchers, ruches, inspections) en NestJS, avec une architecture propre (Clean Architecture + DDD léger), persistance via Prisma Postgres (instance hébergée), authentification JWT avec refresh tokens, pagination et filtrage sur les listes, et documentation Swagger. L'API permettra aux apiculteurs de gérer leurs ruchers, ruches et inspections de manière sécurisée.

---

## Implementation Steps

### Step 1: Initialisation du projet NestJS & configuration de base

**Files:**

- `package.json`
- `tsconfig.json`, `tsconfig.build.json`
- `nest-cli.json`
- `.gitignore`
- `.env.example`
- `.eslintrc.js`, `.prettierrc`
- `src/main.ts`
- `src/app.module.ts`

**What:**
Initialiser le projet NestJS avec `nest new`, activer le mode TypeScript strict. Installer toutes les dépendances nécessaires :

- **Core :** `@nestjs/config`, `@nestjs/swagger`, `@nestjs/passport`, `@nestjs/jwt`, `@nestjs/cqrs`
- **Prisma :** `@prisma/client`, `prisma`
- **Auth :** `passport`, `passport-jwt`, `bcrypt`
- **Validation :** `class-validator`, `class-transformer`, `joi`
- **Dev :** `@types/*`, `supertest`, ESLint, Prettier

Configurer le `.gitignore`, `.env.example` (DATABASE_URL via Prisma Postgres, JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION), et les règles lint/format.

**Testing:** `npm run build` compile sans erreur. `npm run start:dev` démarre le serveur sur le port 3000.

---

### Step 2: Schéma Prisma & configuration base de données

**Files:**

- `prisma/schema.prisma`
- `src/infrastructure/prisma/prisma.module.ts`
- `src/infrastructure/prisma/prisma.service.ts`
- `src/config/config.module.ts`
- `src/config/configuration.ts`
- `src/config/env.validation.ts`

**What:**
Initialiser Prisma (`npx prisma init`) et définir le schéma complet pour **Prisma Postgres** (instance hébergée) :

- **Models :** `User`, `Rucher`, `Ruche`, `Inspection`, `RefreshToken` avec UUIDs, timestamps, `@map`/`@@map` pour convention snake_case en DB.
- **Model `RefreshToken` :** `id`, `token` (hash), `userId`, `expiresAt`, `revokedAt`, `createdAt` — permet la révocation et la rotation des refresh tokens.
- **Enums :** `Role`, `TypeRuche`, `StatutRuche`, `EtatGeneral`, `NiveauReserve`, `Comportement`.
- **Relations :** User → Ruchers → Ruches → Inspections avec cascade delete. User → RefreshTokens.

Créer le `PrismaService` (extends `OnModuleInit`) et `PrismaModule` (global). Configurer `ConfigModule` avec validation Joi des variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `PORT`).

> **Note :** La `DATABASE_URL` proviendra de l'instance Prisma Postgres hébergée (console.prisma.io). Pas de Docker Compose pour la DB.

**Testing:** `npx prisma validate` passe. `npx prisma migrate dev --name init` crée la migration initiale. `npx prisma generate` génère le client sans erreur.

---

### Step 3: Couche Domaine — Entités, Value Objects, Interfaces Repository

**Files:**

- `src/domain/user/entities/user.entity.ts`
- `src/domain/user/value-objects/email.vo.ts`
- `src/domain/user/repositories/user.repository.interface.ts`
- `src/domain/rucher/entities/rucher.entity.ts`
- `src/domain/rucher/value-objects/coordonnees-gps.vo.ts`
- `src/domain/rucher/repositories/rucher.repository.interface.ts`
- `src/domain/ruche/entities/ruche.entity.ts`
- `src/domain/ruche/repositories/ruche.repository.interface.ts`
- `src/domain/inspection/entities/inspection.entity.ts`
- `src/domain/inspection/repositories/inspection.repository.interface.ts`
- `src/shared/types.ts`
- `src/shared/constants.ts`

**What:**
Implémenter la couche domaine **sans aucune dépendance externe** (pas de Prisma, pas de NestJS) :

- **Entités :** Classes pures TypeScript représentant `User`, `Rucher`, `Ruche`, `Inspection` avec leurs propriétés typées et logique métier de base (validation interne).
- **Value Objects :** `Email` (validation format email, normalisation), `CoordonneesGps` (validation latitude -90/+90, longitude -180/+180).
- **Interfaces Repository :** Interfaces définissant les contrats de persistance (`IUserRepository`, `IRucherRepository`, `IRucheRepository`, `IInspectionRepository`, `IRefreshTokenRepository`) avec les tokens d'injection (`Symbol`).
- **Types partagés :** `PaginatedResult<T>` (items, total, page, limit, totalPages), `PaginationParams` (page, limit), `SortParams` (sortBy, sortOrder).

**Testing:** Tests unitaires : les value objects rejettent les valeurs invalides (email malformé, coordonnées hors limites). Les entités s'instancient correctement.

---

### Step 4: Couche Application — Use Cases (Commands & Queries CQRS)

**Files:**

- `src/application/user/commands/register-user.command.ts`
- `src/application/user/commands/register-user.handler.ts`
- `src/application/user/queries/get-user.query.ts`
- `src/application/user/queries/get-user.handler.ts`
- `src/application/rucher/commands/create-rucher.command.ts`
- `src/application/rucher/commands/create-rucher.handler.ts`
- `src/application/rucher/commands/update-rucher.command.ts`
- `src/application/rucher/commands/update-rucher.handler.ts`
- `src/application/rucher/commands/delete-rucher.command.ts`
- `src/application/rucher/commands/delete-rucher.handler.ts`
- `src/application/rucher/queries/list-ruchers.query.ts`
- `src/application/rucher/queries/list-ruchers.handler.ts`
- `src/application/rucher/queries/get-rucher.query.ts`
- `src/application/rucher/queries/get-rucher.handler.ts`
- `src/application/ruche/commands/create-ruche.command.ts`
- `src/application/ruche/commands/create-ruche.handler.ts`
- `src/application/ruche/commands/update-ruche.command.ts`
- `src/application/ruche/commands/update-ruche.handler.ts`
- `src/application/ruche/commands/delete-ruche.command.ts`
- `src/application/ruche/commands/delete-ruche.handler.ts`
- `src/application/ruche/queries/list-ruches.query.ts`
- `src/application/ruche/queries/list-ruches.handler.ts`
- `src/application/ruche/queries/get-ruche.query.ts`
- `src/application/ruche/queries/get-ruche.handler.ts`
- `src/application/inspection/commands/create-inspection.command.ts`
- `src/application/inspection/commands/create-inspection.handler.ts`
- `src/application/inspection/commands/update-inspection.command.ts`
- `src/application/inspection/commands/update-inspection.handler.ts`
- `src/application/inspection/commands/delete-inspection.command.ts`
- `src/application/inspection/commands/delete-inspection.handler.ts`
- `src/application/inspection/queries/list-inspections.query.ts`
- `src/application/inspection/queries/list-inspections.handler.ts`
- `src/application/inspection/queries/get-inspection.query.ts`
- `src/application/inspection/queries/get-inspection.handler.ts`

**What:**
Implémenter les use cases via le pattern CQRS (`@nestjs/cqrs`) :

- **Commands :** Création, mise à jour, suppression pour chaque entité. Chaque handler injecte l'interface repository via `@Inject(SYMBOL)` (dépendance inversée).
- **Queries :** Lecture unitaire (par ID) et liste (filtrée par userId pour le ownership). Chaque handler utilise le repository en lecture seule.
- **Pagination & filtrage :** Les queries de liste acceptent `PaginationParams` + filtres métier optionnels (ex: `statut` pour les ruches, `dateFrom`/`dateTo` pour les inspections) et retournent `PaginatedResult<T>`.
- Le `RegisterUserHandler` gère le hashage du mot de passe (bcrypt) et la vérification d'unicité email.
- Chaque handler vérifie l'ownership (l'utilisateur ne peut accéder qu'à ses propres ressources).

**Testing:** Tests unitaires avec repositories mockés : chaque handler exécute correctement la logique métier, le hashage mot de passe fonctionne, les vérifications de propriété échouent correctement, la pagination retourne les bons totaux.

---

### Step 5: Couche Infrastructure — Implémentation des Repositories Prisma

**Files:**

- `src/infrastructure/repositories/prisma-user.repository.ts`
- `src/infrastructure/repositories/prisma-rucher.repository.ts`
- `src/infrastructure/repositories/prisma-ruche.repository.ts`
- `src/infrastructure/repositories/prisma-inspection.repository.ts`

**What:**
Implémenter les 4 repositories concrets utilisant `PrismaService` :

- Chaque classe `@Injectable()` implémente l'interface repository correspondante.
- Mapping entre les modèles Prisma (DB) et les entités domaine (logique).
- Gestion des relations (include) pour les requêtes imbriquées.
- Gestion des erreurs Prisma (not found, unique constraint violation).
- **Pagination Prisma :** Utilisation de `skip`/`take` + `count()` pour implémenter `PaginatedResult<T>` dans chaque méthode `findAll`.
- **`PrismaRefreshTokenRepository`** : stockage, lookup par token hash, révocation, nettoyage des tokens expirés.

**Testing:** Tests d'intégration contre l'instance Prisma Postgres : vérifier le CRUD complet, les relations cascade, les contraintes d'unicité, la pagination.

---

### Step 6: Authentification JWT avec Refresh Tokens & Sécurité

**Files:**

- `src/infrastructure/auth/auth.module.ts`
- `src/infrastructure/auth/jwt.strategy.ts`
- `src/infrastructure/auth/jwt-refresh.strategy.ts`
- `src/infrastructure/auth/jwt-auth.guard.ts`
- `src/infrastructure/auth/jwt-refresh-auth.guard.ts`
- `src/infrastructure/auth/auth.service.ts`
- `src/infrastructure/repositories/prisma-refresh-token.repository.ts`
- `src/interfaces/auth/auth.controller.ts`
- `src/interfaces/auth/auth.module.ts`
- `src/interfaces/auth/dto/register.dto.ts`
- `src/interfaces/auth/dto/login.dto.ts`
- `src/interfaces/auth/dto/refresh-token.dto.ts`
- `src/interfaces/common/decorators/current-user.decorator.ts`
- `src/interfaces/common/guards/ownership.guard.ts`

**What:**
Mettre en place l'authentification complète avec **refresh tokens** :

- **`AuthService`** :
  - `register()` : hash bcrypt + création user + génération paire access/refresh tokens.
  - `login()` : vérification credentials + génération paire access/refresh tokens.
  - `refreshTokens()` : validation du refresh token, rotation (révocation de l'ancien + émission d'un nouveau couple access/refresh).
  - `logout()` : révocation du refresh token.
  - `validateUser()`.
- **Access Token** : durée courte (15 min), payload `{ sub: userId, email, role }`.
- **Refresh Token** : durée longue (7 jours), stocké hashé en DB (model `RefreshToken`), rotation à chaque refresh.
- **`JwtStrategy`** (Passport) : validation de l'access token.
- **`JwtRefreshStrategy`** : validation du refresh token.
- **`JwtAuthGuard`** / **`JwtRefreshAuthGuard`** : guards dédiés.
- **`@CurrentUser()` decorator** : paramètre decorator personnalisé pour injecter l'utilisateur authentifié.
- **`OwnershipGuard`** : vérifie que la ressource accédée appartient à l'utilisateur courant.
- **DTOs** : `RegisterDto`, `LoginDto`, `RefreshTokenDto` avec class-validator.
- **Endpoints** : `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.

**Testing:** Test E2E : inscription → login → récupération access + refresh tokens → refresh génère un nouveau couple → logout révoque le refresh token → ancien refresh token rejeté. Token invalide/expiré retourne 401. Accès à une ressource d'un autre utilisateur retourne 403.

---

### Step 7: Couche Interfaces — Contrôleurs REST, DTOs, Modules

**Files:**

- `src/interfaces/rucher/rucher.controller.ts`
- `src/interfaces/rucher/rucher.module.ts`
- `src/interfaces/rucher/dto/create-rucher.dto.ts`
- `src/interfaces/rucher/dto/update-rucher.dto.ts`
- `src/interfaces/ruche/ruche.controller.ts`
- `src/interfaces/ruche/ruche.module.ts`
- `src/interfaces/ruche/dto/create-ruche.dto.ts`
- `src/interfaces/ruche/dto/update-ruche.dto.ts`
- `src/interfaces/inspection/inspection.controller.ts`
- `src/interfaces/inspection/inspection.module.ts`
- `src/interfaces/inspection/dto/create-inspection.dto.ts`
- `src/interfaces/inspection/dto/update-inspection.dto.ts`
- `src/interfaces/common/filters/http-exception.filter.ts`
- `src/interfaces/common/interceptors/transform.interceptor.ts`
- `src/interfaces/common/pipes/validation.pipe.ts`
- `src/app.module.ts` (mise à jour)

**What:**
Créer les endpoints REST complets avec **pagination et filtrage** :

- **Rucher :** `POST /ruchers`, `GET /ruchers?page=1&limit=10&search=...`, `GET /ruchers/:id`, `PUT /ruchers/:id`, `DELETE /ruchers/:id`
- **Ruche :** `POST /ruchers/:rucherId/ruches`, `GET /ruchers/:rucherId/ruches?page=1&limit=10&statut=ACTIVE&type=DADANT`, `GET /ruches/:id`, `PUT /ruches/:id`, `DELETE /ruches/:id`
- **Inspection :** `POST /ruches/:rucheId/inspections`, `GET /ruches/:rucheId/inspections?page=1&limit=10&dateFrom=...&dateTo=...&etatGeneral=BON`, `GET /inspections/:id`, `PUT /inspections/:id`, `DELETE /inspections/:id`

**Fichiers additionnels pour pagination/filtrage :**

- `src/interfaces/common/dto/pagination.dto.ts` — DTO partagé `PaginationQueryDto` (`page`, `limit`, `sortBy`, `sortOrder`) avec class-validator.
- `src/interfaces/ruche/dto/filter-ruche.dto.ts` — Filtres optionnels : `statut`, `type`.
- `src/interfaces/inspection/dto/filter-inspection.dto.ts` — Filtres optionnels : `dateFrom`, `dateTo`, `etatGeneral`.

Chaque contrôleur :

- Utilise `CommandBus` / `QueryBus` pour dispatcher les use cases.
- Applique `@UseGuards(JwtAuthGuard)` sur toutes les routes.
- Utilise `@CurrentUser()` pour injecter l'utilisateur.
- Valide les entrées via DTOs (`class-validator`) avec `@ApiProperty()` Swagger.
- **Les endpoints GET de liste** acceptent `@Query() pagination: PaginationQueryDto` + filtres spécifiques et retournent `{ data: T[], meta: { total, page, limit, totalPages } }`.

Ajouter les éléments transversaux :

- **`HttpExceptionFilter`** : format d'erreur uniforme.
- **`TransformInterceptor`** : wrapping des réponses `{ data, meta?, statusCode }`.
- **`ValidationPipe`** : validation globale avec whitelist et forbidNonWhitelisted.

Assembler tous les modules dans `AppModule`.

**Testing:** Test E2E : CRUD complet sur chaque ressource via Supertest. Pagination retourne les bons `meta` (total, pages). Filtrage retourne uniquement les résultats correspondants. Validation DTO rejette les champs invalides. Routes protégées sans token retournent 401. Réponses ont le format standardisé.

---

### Step 8: Documentation Swagger & finalisation

**Files:**

- `src/main.ts` (mise à jour setup Swagger)
- `docker-compose.yml`
- `docker-compose.test.yml`
- `.env.example` (mise à jour finale)
- `README.md`

**What:**

- Configurer Swagger dans `main.ts` : `SwaggerModule.setup()` avec titre, description, version, tags par domaine, schéma JWT Bearer.
- Ajouter les décorateurs Swagger manquants (`@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`, `@ApiQuery` pour pagination/filtres) sur les contrôleurs.
- Documenter les endpoints d'auth incluant le flux refresh token.
- Rédiger le `README.md` : description projet, prérequis, installation, configuration Prisma Postgres (DATABASE_URL), lancement dev, migration Prisma, tests, accès Swagger.
- Finaliser `.env.example` avec toutes les variables documentées (DATABASE_URL Prisma Postgres, JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION, PORT).

> **Note :** Pas de `docker-compose.yml` pour la DB : l'instance Prisma Postgres hébergée est utilisée en dev et en production.

**Testing:** `npm run start:dev` → accès `http://localhost:3000/api` affiche Swagger UI avec tous les endpoints documentés. Tous les schémas, paramètres de pagination/filtrage et réponses sont visibles.

---

### Step 9: Tests unitaires & d'intégration complets

**Files:**

- `test/unit/domain/email.vo.spec.ts`
- `test/unit/domain/coordonnees-gps.vo.spec.ts`
- `test/unit/application/register-user.handler.spec.ts`
- `test/unit/application/create-rucher.handler.spec.ts`
- `test/unit/application/create-ruche.handler.spec.ts`
- `test/unit/application/create-inspection.handler.spec.ts`
- `test/integration/repositories/prisma-user.repository.spec.ts`
- `test/integration/repositories/prisma-rucher.repository.spec.ts`
- `test/e2e/auth.e2e-spec.ts`
- `test/e2e/rucher.e2e-spec.ts`
- `test/e2e/ruche.e2e-spec.ts`
- `test/e2e/inspection.e2e-spec.ts`
- `jest.config.ts` (mise à jour)
- `package.json` (scripts de test)

**What:**
Compléter la couverture de tests :

- **Unitaires domaine :** Value objects (Email valide/invalide, GPS limites), entités (instanciation, logique).
- **Unitaires application :** Handlers isolés avec repositories mockés, vérification appels, gestion erreurs.
- **Intégration :** Repositories Prisma contre l'instance Prisma Postgres de test (CRUD, relations, contraintes, pagination).
- **E2E :** Flux complets via Supertest — auth (register/login/refresh/logout), CRUD ruchers/ruches/inspections avec ownership, pagination et filtrage.

Configurer les scripts npm : `test`, `test:unit`, `test:integration`, `test:e2e`, `test:cov`.

**Testing:** `npm run test` passe (unitaires). `npm run test:e2e` passe (E2E avec DB Docker). Coverage ≥ 80% sur domain/application.

---

### Step 10: Linting, hooks pre-commit & CI/CD (GitHub Actions)

**Files:**

- `.eslintrc.js` (finalisation règles)
- `.prettierrc`
- `.husky/pre-commit`
- `.github/workflows/ci.yml`
- `lint-staged.config.js`
- `package.json` (scripts)

**What:**

- Configurer ESLint avec les règles TypeScript strictes et les règles NestJS.
- Configurer Prettier (semi, singleQuote, trailingComma).
- Installer Husky + lint-staged pour hooks pre-commit (lint + format + test unitaires).
- Créer le workflow **GitHub Actions** CI :
  - Trigger : push sur `main` et pull requests.
  - Jobs : checkout → setup Node 20 → install → lint → test:unit → test:e2e.
  - Secret `DATABASE_URL` pour l'instance Prisma Postgres de test.
  - `npx prisma migrate deploy` avant les tests d'intégration.

**Testing:** `npm run lint` passe sans erreur. Un commit déclenche le hook pre-commit. Le push déclenche le pipeline GitHub Actions CI.

---

## Résumé des commits prévus

| #   | Commit                                                          | Couche         |
| --- | --------------------------------------------------------------- | -------------- |
| 1   | `chore: init NestJS project with dependencies`                  | Setup          |
| 2   | `feat: add Prisma schema and database config`                   | Infrastructure |
| 3   | `feat: add domain layer (entities, VOs, repository interfaces)` | Domaine        |
| 4   | `feat: add application layer (CQRS commands & queries)`         | Application    |
| 5   | `feat: add Prisma repository implementations`                   | Infrastructure |
| 6   | `feat: add JWT auth with refresh tokens & security`             | Sécurité       |
| 7   | `feat: add REST controllers, DTOs, pagination & filtering`      | Interfaces     |
| 8   | `docs: add Swagger, Docker, README`                             | Documentation  |
| 9   | `test: add unit, integration & e2e tests`                       | Tests          |
| 10  | `chore: add linting, pre-commit hooks & CI/CD`                  | Qualité        |

---

## Décisions confirmées

| Décision              | Choix                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| CI/CD                 | **GitHub Actions**                                                               |
| Base de données       | **Prisma Postgres** (instance hébergée via console.prisma.io)                    |
| Authentification      | **JWT avec refresh tokens** (rotation, révocation, stockage hashé en DB)         |
| Pagination & filtrage | **Inclus** sur tous les endpoints de liste (page, limit, sortBy, filtres métier) |
