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
