# Step 10 — Linting, hooks pre-commit & CI/CD (GitHub Actions)

## Goal
Finaliser la qualité de code avec ESLint strict + Prettier, installer Husky + lint-staged pour les hooks pre-commit, et mettre en place un pipeline CI/CD GitHub Actions complet (lint → tests unitaires → tests e2e).

## Prerequisites
S'assurer d'être sur la branche `feat/api-mellifera-init` avant de commencer.
Si ce n'est pas le cas, basculer sur cette branche. Si elle n'existe pas, la créer depuis `main`.

---

### Step-by-Step Instructions

---

#### Step 1: Installer les dépendances manquantes

Les packages `eslint-plugin-prettier` et `eslint-config-prettier` sont référencés dans `.eslintrc.js` (via `plugin:prettier/recommended`) mais absents des `devDependencies`. On installe aussi `husky` et `lint-staged`.

- [x] Exécuter la commande suivante pour installer les dépendances :

```bash
npm install --save-dev eslint-plugin-prettier eslint-config-prettier husky lint-staged
```

##### Step 1 Verification Checklist
- [x] `npm ls eslint-plugin-prettier` affiche la version installée sans erreur
- [x] `npm ls eslint-config-prettier` affiche la version installée sans erreur
- [x] `npm ls husky` affiche la version installée sans erreur
- [x] `npm ls lint-staged` affiche la version installée sans erreur

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Mettre à jour `.eslintrc.js` avec les règles finalisées

L'ESLint config actuelle ne couvre pas `src/generated/` dans les `ignorePatterns` et manque quelques règles utiles. On la finalise.

- [x] Remplacer le contenu complet de `.eslintrc.js` par :

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
  ignorePatterns: [
    '.eslintrc.js',
    'dist/',
    'node_modules/',
    'src/generated/',
    'coverage/',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/require-await': 'warn',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

##### Step 2 Verification Checklist
- [x] `npm run lint` s'exécute sans erreur de configuration ESLint (des warnings sont acceptables)

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Créer `.eslintignore` et `.prettierignore`

Pour s'assurer que les fichiers générés, les dossiers build et les dépendances sont exclus du linting et du formatage.

- [x] Créer le fichier `.eslintignore` avec le contenu suivant :

```
dist/
node_modules/
src/generated/
coverage/
*.js
!.eslintrc.js
```

- [x] Créer le fichier `.prettierignore` avec le contenu suivant :

```
dist/
node_modules/
src/generated/
coverage/
pnpm-lock.yaml
package-lock.json
prisma/migrations/
```

##### Step 3 Verification Checklist
- [x] `npm run lint` ignore les fichiers de `src/generated/` et `dist/`
- [x] `npm run format` ignore les fichiers de `src/generated/` et `dist/`

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop ici et attendre que vous testiez, ajoutiez et commitiez les changements.

---

#### Step 4: Ajouter les scripts npm manquants

On ajoute des scripts utiles pour le CI et le workflow quotidien.

- [ ] Mettre à jour la section `"scripts"` de `package.json` pour qu'elle contienne exactement :

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"**/*.{ts,js,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md}\"",
    "test": "jest",
    "test:unit": "jest --testPathPattern=test/unit",
    "test:integration": "jest --testPathPattern=test/integration",
    "test:e2e": "jest --testPathPattern=test/e2e --forceExit --detectOpenHandles",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prepare": "husky"
  }
}
```

> **Note :** Le script `"prepare": "husky"` est le format recommandé par Husky v9+. Il s'exécute automatiquement après `npm install`.

##### Step 4 Verification Checklist
- [ ] `npm run lint` fonctionne
- [ ] `npm run lint:fix` fonctionne
- [ ] `npm run format:check` fonctionne (peut signaler des fichiers non formatés)
- [ ] `npm run format` fonctionne

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 5: Configurer Husky et lint-staged

Husky v9+ utilise le répertoire `.husky/` avec des scripts shell simples. lint-staged est configuré via un fichier dédié.

- [ ] Initialiser Husky :

```bash
npx husky init
```

> Cela crée le répertoire `.husky/` et un fichier `pre-commit` par défaut.

- [ ] Remplacer le contenu de `.husky/pre-commit` par :

```shell
npx lint-staged
```

- [ ] Créer le fichier `lint-staged.config.js` à la racine du projet avec le contenu suivant :

```javascript
module.exports = {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.{js,json,md}': ['prettier --write'],
};
```

##### Step 5 Verification Checklist
- [ ] Le répertoire `.husky/` existe avec le fichier `pre-commit`
- [ ] `cat .husky/pre-commit` affiche `npx lint-staged`
- [ ] Le fichier `lint-staged.config.js` existe à la racine
- [ ] Tester le hook manuellement : modifier un fichier `.ts`, faire `git add .` puis `git commit -m "test hook"` — lint-staged doit s'exécuter

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6: Ajouter `.nvmrc` pour contraindre la version Node

- [ ] Créer le fichier `.nvmrc` à la racine du projet :

```
22
```

- [ ] Ajouter le champ `engines` dans `package.json` (au même niveau que `"name"`, `"version"`, etc.) :

```json
{
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  }
}
```

> **Placement :** Ajouter le bloc `"engines"` juste après `"private": true,` dans `package.json`.

##### Step 6 Verification Checklist
- [ ] `cat .nvmrc` affiche `22`
- [ ] `node -v` retourne une version >= 22.x

#### Step 6 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 7: Créer le workflow GitHub Actions CI

- [ ] Créer le dossier `.github/workflows/` s'il n'existe pas
- [ ] Créer le fichier `.github/workflows/ci.yml` avec le contenu suivant :

```yaml
name: CI

on:
  push:
    branches: [main, feat/**]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Check formatting
        run: npm run format:check

      - name: Run ESLint
        run: npm run lint

  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run unit tests
        run: npm run test:unit

  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET || 'ci-test-secret-key-not-for-production' }}
      JWT_ACCESS_EXPIRATION: '15m'
      JWT_REFRESH_EXPIRATION: '7d'
      PORT: 3000
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Run E2E tests
        run: npm run test:e2e

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-unit, test-e2e]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build project
        run: npm run build
```

> **Secrets GitHub requis :**
> - `DATABASE_URL` : URL de l'instance Prisma Postgres de test
> - `JWT_SECRET` (optionnel) : utilisera une valeur par défaut en CI si non défini
>
> **Pour configurer les secrets :** Aller dans le repository GitHub → Settings → Secrets and variables → Actions → New repository secret.

##### Step 7 Verification Checklist
- [ ] Le fichier `.github/workflows/ci.yml` existe et est bien formaté (pas d'erreurs YAML)
- [ ] Valider la syntaxe YAML : `cat .github/workflows/ci.yml | head -5` doit afficher `name: CI`
- [ ] Le workflow se déclenche sur push sur `main` et `feat/**`, et sur les pull requests vers `main`
- [ ] 4 jobs : `lint`, `test-unit`, `test-e2e`, `build`
- [ ] `test-unit` et `test-e2e` dépendent de `lint` (ne s'exécutent que si lint passe)
- [ ] `build` dépend de `test-unit` et `test-e2e`

#### Step 7 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 8: Mettre à jour le `.env.example` avec les notes CI

- [ ] Ajouter les commentaires CI à la fin de `.env.example` :

Ajouter le bloc suivant à la fin du fichier `.env.example` existant :

```dotenv

# ──────────────────────────────────────────
# CI/CD (GitHub Actions)
# ──────────────────────────────────────────
# Ces variables sont configurées comme secrets dans GitHub Actions.
# Voir .github/workflows/ci.yml pour les détails.
# Secrets requis dans GitHub :
#   - DATABASE_URL     : URL de la base Prisma Postgres de test
#   - JWT_SECRET       : (optionnel) clé secrète JWT pour les tests CI
```

##### Step 8 Verification Checklist
- [ ] `cat .env.example` affiche les notes CI en bas du fichier

#### Step 8 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 9: Mettre à jour le `README.md` avec les sections Qualité de code & CI/CD

- [ ] Ajouter les sections suivantes à la fin du `README.md` existant (avant la dernière section s'il y en a une, sinon à la fin) :

```markdown

## 🔍 Qualité de code

### Linting & Formatage

```bash
# Vérifier le linting
npm run lint

# Corriger automatiquement les erreurs de lint
npm run lint:fix

# Vérifier le formatage (CI-friendly, pas de modification)
npm run format:check

# Formater tous les fichiers
npm run format
```

### Pre-commit Hooks

Le projet utilise **Husky** + **lint-staged** pour exécuter automatiquement le linting et le formatage avant chaque commit.

Les fichiers `.ts` passent par ESLint (avec `--fix`) puis Prettier. Les fichiers `.js`, `.json` et `.md` passent uniquement par Prettier.

La configuration se trouve dans :
- `.husky/pre-commit` — hook git pre-commit
- `lint-staged.config.js` — règles lint-staged

### Stack Qualité

| Outil | Version | Rôle |
|-------|---------|------|
| ESLint | ^8.x | Linting TypeScript |
| Prettier | ^2.x | Formatage de code |
| Husky | ^9.x | Git hooks |
| lint-staged | latest | Lint sur fichiers stagés uniquement |

## 🚀 CI/CD — GitHub Actions

Le pipeline CI s'exécute automatiquement sur :
- **Push** sur `main` et `feat/**`
- **Pull requests** vers `main`

### Jobs du pipeline

```
lint → test-unit ─┐
                   ├──→ build
lint → test-e2e  ─┘
```

| Job | Description |
|-----|-------------|
| **Lint & Format Check** | Vérifie le formatage Prettier et les règles ESLint |
| **Unit Tests** | Exécute les tests unitaires (`test/unit/`) |
| **E2E Tests** | Exécute les tests end-to-end (`test/e2e/`) avec DB |
| **Build** | Compile le projet TypeScript |

### Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | URL de connexion Prisma Postgres (instance de test) |
| `JWT_SECRET` | *(optionnel)* Clé secrète JWT — valeur par défaut utilisée si absent |

Pour configurer : **Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
```

##### Step 9 Verification Checklist
- [ ] Le `README.md` contient les sections "Qualité de code" et "CI/CD — GitHub Actions"
- [ ] Les commandes documentées fonctionnent : `npm run lint`, `npm run format:check`

#### Step 9 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 10: Vérification finale globale

- [ ] Exécuter les vérifications suivantes dans l'ordre :

```bash
# 1. Linting — doit passer sans erreurs (warnings acceptables)
npm run lint

# 2. Vérification du formatage
npm run format:check

# 3. Tests unitaires
npm run test:unit

# 4. Build
npm run build
```

- [ ] Vérifier la structure finale des fichiers ajoutés/modifiés :

```
.eslintrc.js              ← mis à jour (ignorePatterns + règles)
.eslintignore             ← NOUVEAU
.prettierrc               ← inchangé
.prettierignore           ← NOUVEAU
.nvmrc                    ← NOUVEAU
.husky/pre-commit         ← NOUVEAU
lint-staged.config.js     ← NOUVEAU
.github/workflows/ci.yml  ← NOUVEAU
.env.example              ← mis à jour (notes CI)
package.json              ← mis à jour (scripts + engines)
README.md                 ← mis à jour (sections qualité + CI)
```

##### Step 10 Verification Checklist
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run format:check` passe sans erreur
- [ ] `npm run test:unit` passe
- [ ] `npm run build` passe sans erreur
- [ ] Le répertoire `.husky/` contient le fichier `pre-commit`
- [ ] Le fichier `.github/workflows/ci.yml` contient 4 jobs (lint, test-unit, test-e2e, build)
- [ ] `git status` montre tous les fichiers attendus
- [ ] Un commit test déclenche le hook pre-commit (lint-staged s'exécute)

#### Step 10 STOP & COMMIT
**STOP & COMMIT:** Commit final :
```bash
git add -A
git commit -m "chore: add linting, pre-commit hooks & CI/CD"
```
