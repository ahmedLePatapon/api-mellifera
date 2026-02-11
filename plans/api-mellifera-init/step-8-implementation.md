# Step 8 — Documentation Swagger & Finalisation

## Goal
Compléter la documentation Swagger avec les décorateurs `@ApiQuery` manquants sur le contrôleur Rucher, finaliser le `.env.example`, et créer un `README.md` complet décrivant le projet, l'installation, la configuration et l'utilisation.

## Prerequisites
- Steps 1–7 complétées (NestJS init, Prisma schema, Domaine, Application CQRS, Repositories Prisma, Auth JWT, Contrôleurs REST)
- `npm run build` compile sans erreur
- Branche `feat/doc-swagger-finalisation`

---

### Step-by-Step Instructions

---

#### Step 8.1 : Ajouter `@ApiQuery` manquant sur `RucherController`

Le paramètre `search` sur `GET /ruchers` est un `@Query('search')` nu, sans décorateur Swagger. Swagger ne l'affiche donc pas dans la documentation.

- [x] Ouvrir `src/interfaces/rucher/rucher.controller.ts`
- [x] Ajouter l'import `ApiQuery` dans les imports Swagger existants
- [x] Ajouter le décorateur `@ApiQuery` sur la méthode `findAll`

Remplacer le bloc d'import Swagger **existant** :

```typescript
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
```

Par :

```typescript
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
```

Puis ajouter le décorateur `@ApiQuery` sur la méthode `findAll`. Remplacer le bloc **existant** :

```typescript
    @Get()
    @ApiOperation({ summary: 'Lister ses ruchers avec pagination et recherche' })
    @ApiResponse({ status: 200, description: 'Liste paginée des ruchers' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
```

Par :

```typescript
    @Get()
    @ApiOperation({ summary: 'Lister ses ruchers avec pagination et recherche' })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Rechercher par nom ou adresse du rucher',
        example: 'Lavande',
    })
    @ApiResponse({ status: 200, description: 'Liste paginée des ruchers' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
```

##### Step 8.1 Verification Checklist
- [ ] `npm run build` compile sans erreur
- [ ] Le paramètre `search` est visible dans Swagger UI sur `GET /api/v1/ruchers`

#### Step 8.1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 8.2 : Mettre à jour `.env.example` avec commentaires finaux

- [x] Remplacer le contenu intégral de `.env.example` par le contenu ci-dessous :

```dotenv
# ============================================
# API Mellifera — Variables d'environnement
# ============================================
# Copier ce fichier en .env et renseigner les valeurs.
#   cp .env.example .env

# ──────────────────────────────────────────
# Serveur
# ──────────────────────────────────────────
# Port d'écoute HTTP (défaut : 3000)
PORT=3000

# ──────────────────────────────────────────
# Base de données — Prisma Postgres (hébergée)
# ──────────────────────────────────────────
# Récupérer l'URL de connexion depuis https://console.prisma.io
# Format : postgres://<user>:<password>@<host>:5432/postgres?sslmode=require
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# ──────────────────────────────────────────
# JWT — Access Token
# ──────────────────────────────────────────
# Clé secrète pour la signature des JWT (min 16 caractères)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Durée de validité de l'access token (ex: 15m, 1h)
JWT_ACCESS_EXPIRATION="15m"

# ──────────────────────────────────────────
# JWT — Refresh Token
# ──────────────────────────────────────────
# Durée de validité du refresh token (ex: 7d, 30d)
JWT_REFRESH_EXPIRATION="7d"
```

##### Step 8.2 Verification Checklist
- [ ] Le fichier `.env.example` contient toutes les variables documentées
- [ ] Aucune valeur sensible réelle n'est présente (DATABASE_URL avec placeholder)

#### Step 8.2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 8.3 : Créer le `README.md`

- [x] Créer `README.md` à la racine du projet avec le contenu complet ci-dessous :

```markdown
# 🐝 API Mellifera

API REST de gestion apicole construite avec **NestJS**, **Prisma Postgres** et une architecture **Clean Architecture + DDD léger**. Permet aux apiculteurs de gérer leurs ruchers, ruches et inspections de manière sécurisée.

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Lancement](#lancement)
- [Documentation API (Swagger)](#documentation-api-swagger)
- [Endpoints](#endpoints)
- [Authentification](#authentification)
- [Pagination & Filtrage](#pagination--filtrage)
- [Scripts disponibles](#scripts-disponibles)

---

## Fonctionnalités

- **Authentification JWT** avec access tokens (15 min) et refresh tokens (7 jours), rotation et révocation
- **Gestion des ruchers** — CRUD complet avec recherche par nom/adresse
- **Gestion des ruches** — CRUD avec filtrage par statut et type
- **Gestion des inspections** — CRUD avec filtrage par date et état général
- **Pagination** sur toutes les listes avec tri configurable
- **Ownership** — chaque utilisateur ne voit et ne modifie que ses propres ressources
- **Documentation Swagger** interactive

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | [NestJS](https://nestjs.com/) 11 |
| ORM | [Prisma](https://www.prisma.io/) 7.3 avec Prisma Postgres |
| Auth | JWT (access + refresh tokens), Passport, bcrypt |
| Validation | class-validator, class-transformer, Joi |
| Pattern | CQRS (`@nestjs/cqrs`), Clean Architecture, DDD léger |
| Documentation | Swagger / OpenAPI (`@nestjs/swagger`) |
| Langage | TypeScript 5 (mode strict) |

---

## Architecture

```
src/
├── domain/            # Entités, Value Objects, interfaces Repository (aucune dépendance externe)
├── application/       # Use Cases — Commands & Queries (CQRS)
├── infrastructure/    # Implémentations concrètes — Prisma repositories, Auth, Prisma service
├── interfaces/        # Contrôleurs REST, DTOs, Guards, Filtres, Intercepteurs
├── config/            # Configuration NestJS (env validation, AppConfig)
├── shared/            # Types partagés, constantes (tokens d'injection)
└── generated/         # Client Prisma auto-généré
```

**Flux d'une requête :**
```
Client → Controller (interfaces/) → CommandBus/QueryBus → Handler (application/) → Repository interface (domain/) → Prisma Repository (infrastructure/) → DB
```

---

## Prérequis

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- Un compte [Prisma Data Platform](https://console.prisma.io) pour la base de données Prisma Postgres hébergée

---

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/<votre-username>/api-mellifera.git
cd api-mellifera

# Installer les dépendances
npm install
```

---

## Configuration

1. Copier le fichier d'exemple :

```bash
cp .env.example .env
```

2. Renseigner les variables dans `.env` :

| Variable | Description | Exemple |
|----------|------------|---------|
| `PORT` | Port du serveur HTTP | `3000` |
| `DATABASE_URL` | URL Prisma Postgres (depuis console.prisma.io) | `prisma+postgres://accelerate.prisma-data.net/?api_key=...` |
| `JWT_SECRET` | Clé secrète JWT (min 16 caractères) | `votre-clé-secrète-ici` |
| `JWT_ACCESS_EXPIRATION` | Durée de l'access token | `15m` |
| `JWT_REFRESH_EXPIRATION` | Durée du refresh token | `7d` |

---

## Base de données

L'API utilise **Prisma Postgres**, une instance PostgreSQL hébergée par Prisma. Aucun Docker Compose n'est nécessaire pour la base de données.

### Créer l'instance

1. Se rendre sur [console.prisma.io](https://console.prisma.io)
2. Créer un nouveau projet et une instance Prisma Postgres
3. Copier l'URL de connexion dans `DATABASE_URL` du fichier `.env`

### Appliquer les migrations

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations existantes
npx prisma migrate deploy
```

### Créer une nouvelle migration (développement)

```bash
npx prisma migrate dev --name description_de_la_migration
```

### Explorer les données

```bash
npx prisma studio
```

---

## Lancement

```bash
# Mode développement (watch)
npm run start:dev

# Mode production
npm run build
npm run start
```

Le serveur démarre sur `http://localhost:3000` (ou le port défini dans `.env`).

---

## Documentation API (Swagger)

Une fois le serveur lancé, accéder à la documentation Swagger interactive :

```
http://localhost:3000/api
```

Toutes les routes, paramètres, DTOs et réponses y sont documentés. Utilisez le bouton **Authorize** pour entrer votre access token JWT.

---

## Endpoints

### Auth

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Créer un compte | Non |
| `POST` | `/api/v1/auth/login` | Se connecter | Non |
| `POST` | `/api/v1/auth/refresh` | Rafraîchir les tokens | Refresh token |
| `POST` | `/api/v1/auth/logout` | Se déconnecter | Oui |

### Ruchers

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/v1/ruchers` | Créer un rucher | Oui |
| `GET` | `/api/v1/ruchers` | Lister ses ruchers | Oui |
| `GET` | `/api/v1/ruchers/:id` | Détail d'un rucher | Oui |
| `PUT` | `/api/v1/ruchers/:id` | Modifier un rucher | Oui |
| `DELETE` | `/api/v1/ruchers/:id` | Supprimer un rucher | Oui |

### Ruches

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/v1/ruchers/:rucherId/ruches` | Créer une ruche | Oui |
| `GET` | `/api/v1/ruchers/:rucherId/ruches` | Lister les ruches d'un rucher | Oui |
| `GET` | `/api/v1/ruches/:id` | Détail d'une ruche | Oui |
| `PUT` | `/api/v1/ruches/:id` | Modifier une ruche | Oui |
| `DELETE` | `/api/v1/ruches/:id` | Supprimer une ruche | Oui |

### Inspections

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/v1/ruches/:rucheId/inspections` | Créer une inspection | Oui |
| `GET` | `/api/v1/ruches/:rucheId/inspections` | Lister les inspections d'une ruche | Oui |
| `GET` | `/api/v1/inspections/:id` | Détail d'une inspection | Oui |
| `PUT` | `/api/v1/inspections/:id` | Modifier une inspection | Oui |
| `DELETE` | `/api/v1/inspections/:id` | Supprimer une inspection | Oui |

---

## Authentification

L'API utilise un système JWT à double token :

1. **Access Token** — Durée courte (15 min), envoyé dans le header `Authorization: Bearer <token>`
2. **Refresh Token** — Durée longue (7 jours), stocké hashé en base, utilisé pour obtenir un nouveau couple de tokens

### Flux d'authentification

```
1. POST /auth/register  →  { user, tokens: { accessToken, refreshToken } }
2. POST /auth/login     →  { user, tokens: { accessToken, refreshToken } }
3. Requêtes API avec    →  Authorization: Bearer <accessToken>
4. Token expiré ?       →  POST /auth/refresh { refreshToken }  →  { accessToken, refreshToken }
5. Déconnexion          →  POST /auth/logout { refreshToken }
```

Le refresh token est **rotatif** : chaque appel à `/auth/refresh` révoque l'ancien et en génère un nouveau.

---

## Pagination & Filtrage

Tous les endpoints de liste supportent la pagination et le tri :

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | `1` | Numéro de la page |
| `limit` | number | `10` | Éléments par page (max 100) |
| `sortBy` | string | — | Champ de tri (ex: `createdAt`, `nom`) |
| `sortOrder` | string | `desc` | Ordre de tri (`asc` ou `desc`) |

### Filtres spécifiques

**Ruchers :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche par nom ou adresse |

**Ruches :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `statut` | enum | `ACTIVE`, `INACTIVE`, `MORTE`, `VENDUE`, `ESSAIMEE` |
| `type` | enum | `DADANT`, `LANGSTROTH`, `WARRE`, `VOIRNOT`, `KENYANE`, `AUTRE` |

**Inspections :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `dateFrom` | ISO date | Date de début |
| `dateTo` | ISO date | Date de fin |
| `etatGeneral` | enum | `EXCELLENT`, `BON`, `MOYEN`, `FAIBLE`, `CRITIQUE` |

### Format de réponse paginée

```json
{
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "statusCode": 200
}
```

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run build` | Compiler le projet TypeScript |
| `npm run start` | Lancer en production |
| `npm run start:dev` | Lancer en mode développement (watch) |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run format` | Formater le code avec Prettier |
```

##### Step 8.3 Verification Checklist
- [ ] Le fichier `README.md` existe à la racine du projet
- [ ] Les sections sont cohérentes avec le code actuel
- [ ] Les commandes documentées fonctionnent (`npm run build`, `npm run start:dev`)

#### Step 8.3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 8.4 : Vérification finale — Build & Swagger UI

- [ ] Exécuter `npm run build` et vérifier qu'il n'y a aucune erreur de compilation
- [ ] Lancer `npm run start:dev`
- [ ] Ouvrir `http://localhost:3000/api` dans le navigateur
- [ ] Vérifier les points suivants dans Swagger UI :

| Vérification | Attendu |
|-------------|---------|
| Tags visibles | Auth, Ruchers, Ruches, Inspections |
| Bouton Authorize | Présent avec schéma Bearer JWT |
| `POST /api/v1/auth/register` | DTOs register visibles |
| `POST /api/v1/auth/login` | DTOs login visibles |
| `POST /api/v1/auth/refresh` | DTO refreshToken visible |
| `POST /api/v1/auth/logout` | Bearer auth requis |
| `GET /api/v1/ruchers` | Params page, limit, sortBy, sortOrder, **search** visibles |
| `GET /api/v1/ruchers/:rucherId/ruches` | Params pagination + filtres statut, type visibles |
| `GET /api/v1/ruches/:rucheId/inspections` | Params pagination + filtres dateFrom, dateTo, etatGeneral visibles |
| Tous les endpoints `PUT`/`DELETE` | Param UUID `:id` documenté |
| Réponses HTTP | Codes 200/201/204/400/401/404/409 documentés par endpoint |

##### Step 8.4 Verification Checklist
 - [x] `npm run build` : zéro erreur
 - [x] Swagger UI accessible à `http://localhost:3000/api`
 - [x] Les 4 tags sont visibles et groupent correctement les endpoints
 - [x] Le paramètre `search` apparaît sur `GET /ruchers`
 - [x] Tous les DTOs affichent leurs propriétés avec types et exemples
 - [x] Le bouton Authorize fonctionne et accepte un JWT

#### Step 8.4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
Commit message : `docs: add Swagger documentation, README & finalize .env.example`
