# API Mellifera — Step 3 : Couche Domaine — Entités, Value Objects, Interfaces Repository

## Goal

Implémenter la couche domaine pure TypeScript (sans aucune dépendance NestJS ou Prisma) comprenant les entités métier (User, Rucher, Ruche, Inspection, RefreshToken), les value objects (Email, CoordonneesGps), les interfaces repository avec tokens d'injection Symbol, et les types partagés (pagination, tri).

## Prerequisites

L'utilisateur doit être sur la branche `feat/api-mellifera-init` avant de commencer.

```bash
git checkout feat/api-mellifera-init
```

Le Step 2 (Prisma schema, PrismaService, ConfigModule) doit être complété et commité.

---

### Step-by-Step Instructions

#### Step 3.1 : Créer les types partagés et constantes

- [x] Créer le fichier `src/shared/types.ts` :

```typescript
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

- [x] Créer le fichier `src/shared/constants.ts` :

```typescript
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const RUCHER_REPOSITORY = Symbol('RUCHER_REPOSITORY');
export const RUCHE_REPOSITORY = Symbol('RUCHE_REPOSITORY');
export const INSPECTION_REPOSITORY = Symbol('INSPECTION_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
```

##### Step 3.1 Verification Checklist

- [x] Le fichier `src/shared/types.ts` existe avec `PaginationParams`, `SortParams` et `PaginatedResult<T>`
- [x] Le fichier `src/shared/constants.ts` existe avec les 5 tokens d'injection `Symbol`
- [x] `npm run build` compile sans erreur

---

#### Step 3.2 : Créer les enums du domaine

- [x] Créer le fichier `src/domain/enums.ts` :

```typescript
export enum Role {
  APICULTEUR = 'APICULTEUR',
  ADMIN = 'ADMIN',
}

export enum TypeRuche {
  DADANT = 'DADANT',
  LANGSTROTH = 'LANGSTROTH',
  WARRE = 'WARRE',
  VOIRNOT = 'VOIRNOT',
  KENYANE = 'KENYANE',
  AUTRE = 'AUTRE',
}

export enum StatutRuche {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MORTE = 'MORTE',
  VENDUE = 'VENDUE',
  ESSAIMEE = 'ESSAIMEE',
}

export enum EtatGeneral {
  EXCELLENT = 'EXCELLENT',
  BON = 'BON',
  MOYEN = 'MOYEN',
  FAIBLE = 'FAIBLE',
  CRITIQUE = 'CRITIQUE',
}

export enum NiveauReserve {
  ABONDANT = 'ABONDANT',
  SUFFISANT = 'SUFFISANT',
  FAIBLE = 'FAIBLE',
  VIDE = 'VIDE',
}

export enum Comportement {
  CALME = 'CALME',
  AGITE = 'AGITE',
  AGRESSIF = 'AGRESSIF',
  NORMAL = 'NORMAL',
}
```

> **Note :** On redéfinit les enums dans la couche domaine (indépendamment de Prisma) pour respecter le principe de Clean Architecture : la couche domaine ne dépend d'aucune infrastructure. Les valeurs sont identiques à celles du schéma Prisma, ce qui facilite le mapping dans les repositories (Step 5).

##### Step 3.2 Verification Checklist

- [x] Le fichier `src/domain/enums.ts` existe avec les 6 enums
- [x] Les valeurs correspondent exactement à celles du schéma Prisma
- [x] `npm run build` compile sans erreur

---

#### Step 3.3 : Créer le Value Object Email

- [x] Créer le fichier `src/domain/user/value-objects/email.vo.ts` :

```typescript
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  static create(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const normalized = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

##### Step 3.3 Verification Checklist

- [x] Le fichier `src/domain/user/value-objects/email.vo.ts` existe
- [x] La classe `Email` est immutable (propriété `readonly`, constructeur `private`)
- [x] La factory `create()` valide et normalise l'email (trim + lowercase)
- [x] `npm run build` compile sans erreur

---

#### Step 3.4 : Créer le Value Object CoordonneesGps

- [x] Créer le fichier `src/domain/rucher/value-objects/coordonnees-gps.vo.ts` :

```typescript
export class CoordonneesGps {
  private readonly _latitude: number;
  private readonly _longitude: number;

  private constructor(latitude: number, longitude: number) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  static create(latitude: number, longitude: number): CoordonneesGps {
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90.`);
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180.`);
    }

    return new CoordonneesGps(latitude, longitude);
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  equals(other: CoordonneesGps): boolean {
    return this._latitude === other._latitude && this._longitude === other._longitude;
  }
}
```

##### Step 3.4 Verification Checklist

- [x] Le fichier `src/domain/rucher/value-objects/coordonnees-gps.vo.ts` existe
- [x] La classe `CoordonneesGps` est immutable
- [x] La validation rejette `latitude < -90 || latitude > 90` et `longitude < -180 || longitude > 180`
- [x] `npm run build` compile sans erreur

---

#### Step 3.5 : Créer l'entité User

- [x] Créer le fichier `src/domain/user/entities/user.entity.ts` :

```typescript
import { Role } from '../../enums';
import { Email } from '../value-objects/email.vo';

export interface UserProps {
  id: string;
  email: Email;
  password: string;
  nom: string;
  prenom: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role?: Role;
}

export class UserEntity {
  readonly id: string;
  readonly email: Email;
  readonly password: string;
  readonly nom: string;
  readonly prenom: string;
  readonly role: Role;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.nom = props.nom;
    this.prenom = props.prenom;
    this.role = props.role;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateUserProps): UserEntity {
    if (!props.nom || props.nom.trim().length === 0) {
      throw new Error('User nom cannot be empty');
    }

    if (!props.prenom || props.prenom.trim().length === 0) {
      throw new Error('User prenom cannot be empty');
    }

    if (!props.password || props.password.length < 8) {
      throw new Error('User password must be at least 8 characters long');
    }

    const email = Email.create(props.email);

    return new UserEntity({
      id: '',
      email,
      password: props.password,
      nom: props.nom.trim(),
      prenom: props.prenom.trim(),
      role: props.role ?? Role.APICULTEUR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: UserProps): UserEntity {
    return new UserEntity(props);
  }
}
```

##### Step 3.5 Verification Checklist

- [x] Le fichier `src/domain/user/entities/user.entity.ts` existe
- [x] `UserEntity` utilise le Value Object `Email` (pas une string brute)
- [x] `create()` valide nom, prenom (non vide) et password (min 8 chars)
- [x] `fromPersistence()` reconstruit l'entité depuis les données DB
- [x] `npm run build` compile sans erreur

---

#### Step 3.6 : Créer l'entité Rucher

- [x] Créer le fichier `src/domain/rucher/entities/rucher.entity.ts` :

```typescript
import { CoordonneesGps } from '../value-objects/coordonnees-gps.vo';

export interface RucherProps {
  id: string;
  nom: string;
  adresse: string | null;
  coordonnees: CoordonneesGps | null;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRucherProps {
  nom: string;
  adresse?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  userId: string;
}

export class RucherEntity {
  readonly id: string;
  readonly nom: string;
  readonly adresse: string | null;
  readonly coordonnees: CoordonneesGps | null;
  readonly description: string | null;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: RucherProps) {
    this.id = props.id;
    this.nom = props.nom;
    this.adresse = props.adresse;
    this.coordonnees = props.coordonnees;
    this.description = props.description;
    this.userId = props.userId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateRucherProps): RucherEntity {
    if (!props.nom || props.nom.trim().length === 0) {
      throw new Error('Rucher nom cannot be empty');
    }

    let coordonnees: CoordonneesGps | null = null;
    if (
      props.latitude !== undefined &&
      props.latitude !== null &&
      props.longitude !== undefined &&
      props.longitude !== null
    ) {
      coordonnees = CoordonneesGps.create(props.latitude, props.longitude);
    }

    return new RucherEntity({
      id: '',
      nom: props.nom.trim(),
      adresse: props.adresse?.trim() ?? null,
      coordonnees,
      description: props.description?.trim() ?? null,
      userId: props.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: RucherProps): RucherEntity {
    return new RucherEntity(props);
  }
}
```

##### Step 3.6 Verification Checklist

- [x] Le fichier `src/domain/rucher/entities/rucher.entity.ts` existe
- [x] `RucherEntity` utilise le Value Object `CoordonneesGps` (pas des floats bruts)
- [x] Les coordonnées GPS ne sont créées que si latitude ET longitude sont fournies
- [x] `npm run build` compile sans erreur

---

#### Step 3.7 : Créer l'entité Ruche

- [x] Créer le fichier `src/domain/ruche/entities/ruche.entity.ts` :

```typescript
import { TypeRuche, StatutRuche } from '../../enums';

export interface RucheProps {
  id: string;
  nom: string;
  type: TypeRuche;
  statut: StatutRuche;
  dateAchat: Date | null;
  notes: string | null;
  rucherId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRucheProps {
  nom: string;
  type?: TypeRuche;
  statut?: StatutRuche;
  dateAchat?: Date | null;
  notes?: string | null;
  rucherId: string;
}

export class RucheEntity {
  readonly id: string;
  readonly nom: string;
  readonly type: TypeRuche;
  readonly statut: StatutRuche;
  readonly dateAchat: Date | null;
  readonly notes: string | null;
  readonly rucherId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: RucheProps) {
    this.id = props.id;
    this.nom = props.nom;
    this.type = props.type;
    this.statut = props.statut;
    this.dateAchat = props.dateAchat;
    this.notes = props.notes;
    this.rucherId = props.rucherId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateRucheProps): RucheEntity {
    if (!props.nom || props.nom.trim().length === 0) {
      throw new Error('Ruche nom cannot be empty');
    }

    return new RucheEntity({
      id: '',
      nom: props.nom.trim(),
      type: props.type ?? TypeRuche.DADANT,
      statut: props.statut ?? StatutRuche.ACTIVE,
      dateAchat: props.dateAchat ?? null,
      notes: props.notes?.trim() ?? null,
      rucherId: props.rucherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: RucheProps): RucheEntity {
    return new RucheEntity(props);
  }
}
```

##### Step 3.7 Verification Checklist

- [x] Le fichier `src/domain/ruche/entities/ruche.entity.ts` existe
- [x] Les valeurs par défaut correspondent au schéma Prisma (`DADANT`, `ACTIVE`)
- [x] `npm run build` compile sans erreur

---

#### Step 3.8 : Créer l'entité Inspection

- [x] Créer le fichier `src/domain/inspection/entities/inspection.entity.ts` :

```typescript
import { EtatGeneral, NiveauReserve, Comportement } from '../../enums';

export interface InspectionProps {
  id: string;
  date: Date;
  etatGeneral: EtatGeneral;
  niveauReserve: NiveauReserve | null;
  comportement: Comportement | null;
  presenceReine: boolean | null;
  nombreCadres: number | null;
  presenceMaladie: boolean | null;
  descriptionMaladie: string | null;
  traitementApplique: string | null;
  recolteKg: number | null;
  notes: string | null;
  rucheId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectionProps {
  date: Date;
  etatGeneral: EtatGeneral;
  niveauReserve?: NiveauReserve | null;
  comportement?: Comportement | null;
  presenceReine?: boolean | null;
  nombreCadres?: number | null;
  presenceMaladie?: boolean | null;
  descriptionMaladie?: string | null;
  traitementApplique?: string | null;
  recolteKg?: number | null;
  notes?: string | null;
  rucheId: string;
}

export class InspectionEntity {
  readonly id: string;
  readonly date: Date;
  readonly etatGeneral: EtatGeneral;
  readonly niveauReserve: NiveauReserve | null;
  readonly comportement: Comportement | null;
  readonly presenceReine: boolean | null;
  readonly nombreCadres: number | null;
  readonly presenceMaladie: boolean | null;
  readonly descriptionMaladie: string | null;
  readonly traitementApplique: string | null;
  readonly recolteKg: number | null;
  readonly notes: string | null;
  readonly rucheId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: InspectionProps) {
    this.id = props.id;
    this.date = props.date;
    this.etatGeneral = props.etatGeneral;
    this.niveauReserve = props.niveauReserve;
    this.comportement = props.comportement;
    this.presenceReine = props.presenceReine;
    this.nombreCadres = props.nombreCadres;
    this.presenceMaladie = props.presenceMaladie;
    this.descriptionMaladie = props.descriptionMaladie;
    this.traitementApplique = props.traitementApplique;
    this.recolteKg = props.recolteKg;
    this.notes = props.notes;
    this.rucheId = props.rucheId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateInspectionProps): InspectionEntity {
    if (!props.date) {
      throw new Error('Inspection date is required');
    }

    if (!props.etatGeneral) {
      throw new Error('Inspection etatGeneral is required');
    }

    if (props.nombreCadres !== undefined && props.nombreCadres !== null && props.nombreCadres < 0) {
      throw new Error('Inspection nombreCadres cannot be negative');
    }

    if (props.recolteKg !== undefined && props.recolteKg !== null && props.recolteKg < 0) {
      throw new Error('Inspection recolteKg cannot be negative');
    }

    return new InspectionEntity({
      id: '',
      date: props.date,
      etatGeneral: props.etatGeneral,
      niveauReserve: props.niveauReserve ?? null,
      comportement: props.comportement ?? null,
      presenceReine: props.presenceReine ?? null,
      nombreCadres: props.nombreCadres ?? null,
      presenceMaladie: props.presenceMaladie ?? false,
      descriptionMaladie: props.descriptionMaladie?.trim() ?? null,
      traitementApplique: props.traitementApplique?.trim() ?? null,
      recolteKg: props.recolteKg ?? null,
      notes: props.notes?.trim() ?? null,
      rucheId: props.rucheId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: InspectionProps): InspectionEntity {
    return new InspectionEntity(props);
  }
}
```

##### Step 3.8 Verification Checklist

- [x] Le fichier `src/domain/inspection/entities/inspection.entity.ts` existe
- [x] Les champs requis (date, etatGeneral) sont validés
- [x] Les champs numériques (nombreCadres, recolteKg) rejettent les valeurs négatives
- [x] `presenceMaladie` a une valeur par défaut `false` (cohérent avec le schéma Prisma)
- [x] `npm run build` compile sans erreur

---

#### Step 3.9 : Créer l'entité RefreshToken

- [x] Créer le fichier `src/domain/user/entities/refresh-token.entity.ts` :

```typescript
export interface RefreshTokenProps {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateRefreshTokenProps {
  token: string;
  userId: string;
  expiresAt: Date;
}

export class RefreshTokenEntity {
  readonly id: string;
  readonly token: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;

  private constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.token = props.token;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateRefreshTokenProps): RefreshTokenEntity {
    if (!props.token || props.token.trim().length === 0) {
      throw new Error('RefreshToken token cannot be empty');
    }

    if (!props.userId || props.userId.trim().length === 0) {
      throw new Error('RefreshToken userId cannot be empty');
    }

    if (props.expiresAt <= new Date()) {
      throw new Error('RefreshToken expiresAt must be in the future');
    }

    return new RefreshTokenEntity({
      id: '',
      token: props.token,
      userId: props.userId,
      expiresAt: props.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: RefreshTokenProps): RefreshTokenEntity {
    return new RefreshTokenEntity(props);
  }

  get isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }
}
```

##### Step 3.9 Verification Checklist

- [x] Le fichier `src/domain/user/entities/refresh-token.entity.ts` existe
- [x] Les propriétés calculées `isExpired`, `isRevoked`, `isValid` fonctionnent correctement
- [x] `npm run build` compile sans erreur

---

#### Step 3.10 : Créer l'interface IUserRepository

- [x] Créer le fichier `src/domain/user/repositories/user.repository.interface.ts` :

```typescript
import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(user: UserEntity): Promise<UserEntity>;
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}
```

##### Step 3.10 Verification Checklist

- [x] Le fichier `src/domain/user/repositories/user.repository.interface.ts` existe
- [x] `IUserRepository` inclut `findByEmail` (nécessaire pour l'auth au Step 6)
- [x] `npm run build` compile sans erreur

---

#### Step 3.11 : Créer l'interface IRefreshTokenRepository

- [x] Créer le fichier `src/domain/user/repositories/refresh-token.repository.interface.ts` :

```typescript
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  create(refreshToken: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  findByToken(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revokeByToken(tokenHash: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
```

##### Step 3.11 Verification Checklist

- [x] Le fichier `src/domain/user/repositories/refresh-token.repository.interface.ts` existe
- [x] L'interface inclut `revokeByToken`, `revokeAllByUserId` (révocation), et `deleteExpired` (nettoyage)
- [x] `npm run build` compile sans erreur

---

#### Step 3.12 : Créer l'interface IRucherRepository

- [x] Créer le fichier `src/domain/rucher/repositories/rucher.repository.interface.ts` :

```typescript
import { PaginatedResult, PaginationParams, SortParams } from '../../../shared/types';
import { RucherEntity } from '../entities/rucher.entity';

export interface RucherFilters {
  search?: string;
}

export interface IRucherRepository {
  findById(id: string): Promise<RucherEntity | null>;
  findAllByUserId(
    userId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucherFilters,
  ): Promise<PaginatedResult<RucherEntity>>;
  create(rucher: RucherEntity): Promise<RucherEntity>;
  update(id: string, rucher: Partial<RucherEntity>): Promise<RucherEntity>;
  delete(id: string): Promise<void>;
}
```

##### Step 3.12 Verification Checklist

- [x] Le fichier `src/domain/rucher/repositories/rucher.repository.interface.ts` existe
- [x] `findAllByUserId` accepte `PaginationParams`, `SortParams` optionnel, et `RucherFilters` optionnel
- [x] `npm run build` compile sans erreur

---

#### Step 3.13 : Créer l'interface IRucheRepository

- [x] Créer le fichier `src/domain/ruche/repositories/ruche.repository.interface.ts` :

```typescript
import { PaginatedResult, PaginationParams, SortParams } from '../../../shared/types';
import { TypeRuche, StatutRuche } from '../../enums';
import { RucheEntity } from '../entities/ruche.entity';

export interface RucheFilters {
  statut?: StatutRuche;
  type?: TypeRuche;
}

export interface IRucheRepository {
  findById(id: string): Promise<RucheEntity | null>;
  findAllByRucherId(
    rucherId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucheFilters,
  ): Promise<PaginatedResult<RucheEntity>>;
  create(ruche: RucheEntity): Promise<RucheEntity>;
  update(id: string, ruche: Partial<RucheEntity>): Promise<RucheEntity>;
  delete(id: string): Promise<void>;
}
```

##### Step 3.13 Verification Checklist

- [x] Le fichier `src/domain/ruche/repositories/ruche.repository.interface.ts` existe
- [x] `RucheFilters` inclut `statut` et `type` (filtres métier du plan)
- [x] `npm run build` compile sans erreur

---

#### Step 3.14 : Créer l'interface IInspectionRepository

- [x] Créer le fichier `src/domain/inspection/repositories/inspection.repository.interface.ts` :

```typescript
import { PaginatedResult, PaginationParams, SortParams } from '../../../shared/types';
import { EtatGeneral } from '../../enums';
import { InspectionEntity } from '../entities/inspection.entity';

export interface InspectionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  etatGeneral?: EtatGeneral;
}

export interface IInspectionRepository {
  findById(id: string): Promise<InspectionEntity | null>;
  findAllByRucheId(
    rucheId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: InspectionFilters,
  ): Promise<PaginatedResult<InspectionEntity>>;
  create(inspection: InspectionEntity): Promise<InspectionEntity>;
  update(id: string, inspection: Partial<InspectionEntity>): Promise<InspectionEntity>;
  delete(id: string): Promise<void>;
}
```

##### Step 3.14 Verification Checklist

- [x] Le fichier `src/domain/inspection/repositories/inspection.repository.interface.ts` existe
- [x] `InspectionFilters` inclut `dateFrom`, `dateTo`, `etatGeneral` (filtres métier du plan)
- [x] `npm run build` compile sans erreur

---

#### Step 3.15 : Créer les fichiers index pour faciliter les imports

- [x] Créer le fichier `src/domain/user/index.ts` :

```typescript
export { UserEntity } from './entities/user.entity';
export type { UserProps, CreateUserProps } from './entities/user.entity';
export { RefreshTokenEntity } from './entities/refresh-token.entity';
export type { RefreshTokenProps, CreateRefreshTokenProps } from './entities/refresh-token.entity';
export { Email } from './value-objects/email.vo';
export type { IUserRepository } from './repositories/user.repository.interface';
export type { IRefreshTokenRepository } from './repositories/refresh-token.repository.interface';
```

- [x] Créer le fichier `src/domain/rucher/index.ts` :

```typescript
export { RucherEntity } from './entities/rucher.entity';
export type { RucherProps, CreateRucherProps } from './entities/rucher.entity';
export { CoordonneesGps } from './value-objects/coordonnees-gps.vo';
export type { IRucherRepository, RucherFilters } from './repositories/rucher.repository.interface';
```

- [x] Créer le fichier `src/domain/ruche/index.ts` :

```typescript
export { RucheEntity } from './entities/ruche.entity';
export type { RucheProps, CreateRucheProps } from './entities/ruche.entity';
export type { IRucheRepository, RucheFilters } from './repositories/ruche.repository.interface';
```

- [x] Créer le fichier `src/domain/inspection/index.ts` :

```typescript
export { InspectionEntity } from './entities/inspection.entity';
export type { InspectionProps, CreateInspectionProps } from './entities/inspection.entity';
export type {
  IInspectionRepository,
  InspectionFilters,
} from './repositories/inspection.repository.interface';
```

- [x] Créer le fichier `src/domain/index.ts` :

```typescript
export * from './enums';
export * from './user';
export * from './rucher';
export * from './ruche';
export * from './inspection';
```

- [x] Créer le fichier `src/shared/index.ts` :

```typescript
export type { PaginatedResult, PaginationParams, SortParams } from './types';
export {
  USER_REPOSITORY,
  RUCHER_REPOSITORY,
  RUCHE_REPOSITORY,
  INSPECTION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
} from './constants';
```

##### Step 3.15 Verification Checklist

- [x] Les 6 fichiers index existent : `src/domain/index.ts`, `src/domain/user/index.ts`, `src/domain/rucher/index.ts`, `src/domain/ruche/index.ts`, `src/domain/inspection/index.ts`, `src/shared/index.ts`
- [x] `npm run build` compile sans erreur

---

#### Step 3.16 : Vérification finale — Build et structure

- [x] Compiler le projet :

```bash
npm run build
```

- [x] Vérifier qu'il n'y a **aucune erreur** TypeScript

- [x] Vérifier la structure créée :

```bash
find src/domain src/shared -name "*.ts" | sort
```

- [x] La sortie doit lister exactement :

```
src/domain/enums.ts
src/domain/index.ts
src/domain/inspection/entities/inspection.entity.ts
src/domain/inspection/index.ts
src/domain/inspection/repositories/inspection.repository.interface.ts
src/domain/ruche/entities/ruche.entity.ts
src/domain/ruche/index.ts
src/domain/ruche/repositories/ruche.repository.interface.ts
src/domain/rucher/entities/rucher.entity.ts
src/domain/rucher/index.ts
src/domain/rucher/repositories/rucher.repository.interface.ts
src/domain/rucher/value-objects/coordonnees-gps.vo.ts
src/domain/user/entities/refresh-token.entity.ts
src/domain/user/entities/user.entity.ts
src/domain/user/index.ts
src/domain/user/repositories/refresh-token.repository.interface.ts
src/domain/user/repositories/user.repository.interface.ts
src/domain/user/value-objects/email.vo.ts
src/shared/constants.ts
src/shared/index.ts
src/shared/types.ts
```

- [x] Vérifier que la couche domaine **n'importe aucun module NestJS ou Prisma** :

```bash
grep -r "@nestjs\|@prisma\|from 'prisma'" src/domain/ src/shared/
```

- [x] La commande ne doit **rien retourner** (aucune dépendance infrastructure)

##### Step 3.16 Verification Checklist

- [x] `npm run build` compile avec 0 erreur
- [x] 21 fichiers `.ts` créés (18 dans `src/domain/`, 3 dans `src/shared/`)
- [x] Aucun import NestJS ou Prisma dans `src/domain/` et `src/shared/`
- [x] La couche domaine est 100% pure TypeScript

---

#### Step 3 STOP & COMMIT

**STOP & COMMIT:** L'agent doit s'arrêter ici et attendre que l'utilisateur teste, stage et commit le changement.

```bash
git add .
git commit -m "feat: add domain layer (entities, VOs, repository interfaces)"
```

---

## Résumé des fichiers créés

| Fichier                                                                 | Action                                                                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/shared/types.ts`                                                   | Créé — `PaginatedResult<T>`, `PaginationParams`, `SortParams`                                   |
| `src/shared/constants.ts`                                               | Créé — 5 tokens d'injection `Symbol`                                                            |
| `src/shared/index.ts`                                                   | Créé — barrel exports                                                                           |
| `src/domain/enums.ts`                                                   | Créé — 6 enums domaine (Role, TypeRuche, StatutRuche, EtatGeneral, NiveauReserve, Comportement) |
| `src/domain/index.ts`                                                   | Créé — barrel exports global domaine                                                            |
| `src/domain/user/value-objects/email.vo.ts`                             | Créé — VO Email (validation format, normalisation lowercase)                                    |
| `src/domain/user/entities/user.entity.ts`                               | Créé — Entité User avec validation (nom, prenom, password min 8)                                |
| `src/domain/user/entities/refresh-token.entity.ts`                      | Créé — Entité RefreshToken avec `isExpired`, `isRevoked`, `isValid`                             |
| `src/domain/user/repositories/user.repository.interface.ts`             | Créé — Interface `IUserRepository`                                                              |
| `src/domain/user/repositories/refresh-token.repository.interface.ts`    | Créé — Interface `IRefreshTokenRepository`                                                      |
| `src/domain/user/index.ts`                                              | Créé — barrel exports user                                                                      |
| `src/domain/rucher/value-objects/coordonnees-gps.vo.ts`                 | Créé — VO CoordonneesGps (validation lat -90/+90, lon -180/+180)                                |
| `src/domain/rucher/entities/rucher.entity.ts`                           | Créé — Entité Rucher avec VO CoordonneesGps                                                     |
| `src/domain/rucher/repositories/rucher.repository.interface.ts`         | Créé — Interface `IRucherRepository` avec pagination + `RucherFilters`                          |
| `src/domain/rucher/index.ts`                                            | Créé — barrel exports rucher                                                                    |
| `src/domain/ruche/entities/ruche.entity.ts`                             | Créé — Entité Ruche avec defaults (DADANT, ACTIVE)                                              |
| `src/domain/ruche/repositories/ruche.repository.interface.ts`           | Créé — Interface `IRucheRepository` avec pagination + `RucheFilters`                            |
| `src/domain/ruche/index.ts`                                             | Créé — barrel exports ruche                                                                     |
| `src/domain/inspection/entities/inspection.entity.ts`                   | Créé — Entité Inspection avec validation (date, etatGeneral, valeurs négatives)                 |
| `src/domain/inspection/repositories/inspection.repository.interface.ts` | Créé — Interface `IInspectionRepository` avec pagination + `InspectionFilters`                  |
| `src/domain/inspection/index.ts`                                        | Créé — barrel exports inspection                                                                |

## Architecture domaine

```
src/shared/
├── types.ts              (PaginatedResult<T>, PaginationParams, SortParams)
├── constants.ts          (USER_REPOSITORY, RUCHER_REPOSITORY, ... Symbols)
└── index.ts

src/domain/
├── enums.ts              (Role, TypeRuche, StatutRuche, EtatGeneral, NiveauReserve, Comportement)
├── index.ts
├── user/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── refresh-token.entity.ts
│   ├── value-objects/
│   │   └── email.vo.ts
│   ├── repositories/
│   │   ├── user.repository.interface.ts
│   │   └── refresh-token.repository.interface.ts
│   └── index.ts
├── rucher/
│   ├── entities/
│   │   └── rucher.entity.ts
│   ├── value-objects/
│   │   └── coordonnees-gps.vo.ts
│   ├── repositories/
│   │   └── rucher.repository.interface.ts
│   └── index.ts
├── ruche/
│   ├── entities/
│   │   └── ruche.entity.ts
│   ├── repositories/
│   │   └── ruche.repository.interface.ts
│   └── index.ts
└── inspection/
    ├── entities/
    │   └── inspection.entity.ts
    ├── repositories/
    │   └── inspection.repository.interface.ts
    └── index.ts
```
