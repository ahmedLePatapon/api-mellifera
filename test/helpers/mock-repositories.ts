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

  findById(id: string): Promise<UserEntity | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toString() === normalized) return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  create(user: UserEntity): Promise<UserEntity> {
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
    return Promise.resolve(saved);
  }

  update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const existing = this.users.get(id);
    if (!existing) throw new Error('User not found');
    const d = data;
    const updated = UserEntity.fromPersistence({
      id,
      email: d.email ?? existing.email,
      password: d.password ?? existing.password,
      nom: d.nom ?? existing.nom,
      prenom: d.prenom ?? existing.prenom,
      role: d.role ?? existing.role,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.users.delete(id);
    return Promise.resolve();
  }

  reset(): void {
    this.users.clear();
  }
}

// ── RefreshToken ───────────────────────────────
export class MockRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens = new Map<string, RefreshTokenEntity>();

  create(rt: RefreshTokenEntity): Promise<RefreshTokenEntity> {
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
    return Promise.resolve(saved);
  }

  findByToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
    for (const t of this.tokens.values()) {
      if (t.token === tokenHash) return Promise.resolve(t);
    }
    return Promise.resolve(null);
  }

  revokeByToken(tokenHash: string): Promise<void> {
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
    return Promise.resolve();
  }

  revokeAllByUserId(userId: string): Promise<void> {
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
    return Promise.resolve();
  }

  deleteExpired(): Promise<number> {
    let count = 0;
    for (const [id, t] of this.tokens.entries()) {
      if (t.isExpired) {
        this.tokens.delete(id);
        count++;
      }
    }
    return Promise.resolve(count);
  }

  reset(): void {
    this.tokens.clear();
  }
}

// ── Rucher ─────────────────────────────────────
export class MockRucherRepository implements IRucherRepository {
  private ruchers = new Map<string, RucherEntity>();

  findById(id: string): Promise<RucherEntity | null> {
    return Promise.resolve(this.ruchers.get(id) ?? null);
  }

  findAllByUserId(
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
        const aRecord = a as unknown as Record<string, unknown>;
        const bRecord = b as unknown as Record<string, unknown>;
        const av = aRecord[sort.sortBy];
        const bv = bRecord[sort.sortBy];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.sortOrder === 'asc' ? cmp : -cmp;
      });
    }
    const total = items.length;
    const start = (pagination.page - 1) * pagination.limit;
    items = items.slice(start, start + pagination.limit);
    return Promise.resolve({
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    });
  }

  create(rucher: RucherEntity): Promise<RucherEntity> {
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
    return Promise.resolve(saved);
  }

  update(id: string, data: Partial<RucherEntity>): Promise<RucherEntity> {
    const existing = this.ruchers.get(id);
    if (!existing) throw new Error('Rucher not found');
    const dr = data;
    const updated = RucherEntity.fromPersistence({
      id,
      nom: dr.nom ?? existing.nom,
      adresse: dr.adresse !== undefined ? dr.adresse : existing.adresse,
      coordonnees: dr.coordonnees !== undefined ? dr.coordonnees : existing.coordonnees,
      description: dr.description !== undefined ? dr.description : existing.description,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.ruchers.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.ruchers.delete(id);
    return Promise.resolve();
  }

  reset(): void {
    this.ruchers.clear();
  }
}

// ── Ruche ──────────────────────────────────────
export class MockRucheRepository implements IRucheRepository {
  private ruches = new Map<string, RucheEntity>();

  findById(id: string): Promise<RucheEntity | null> {
    return Promise.resolve(this.ruches.get(id) ?? null);
  }

  findAllByRucherId(
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
    return Promise.resolve({
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    });
  }

  create(ruche: RucheEntity): Promise<RucheEntity> {
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
    return Promise.resolve(saved);
  }

  update(id: string, data: Partial<RucheEntity>): Promise<RucheEntity> {
    const existing = this.ruches.get(id);
    if (!existing) throw new Error('Ruche not found');
    const rr = data;
    const updated = RucheEntity.fromPersistence({
      id,
      nom: rr.nom ?? existing.nom,
      type: rr.type ?? existing.type,
      statut: rr.statut ?? existing.statut,
      dateAchat: rr.dateAchat !== undefined ? rr.dateAchat : existing.dateAchat,
      notes: rr.notes !== undefined ? rr.notes : existing.notes,
      rucherId: existing.rucherId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.ruches.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.ruches.delete(id);
    return Promise.resolve();
  }

  reset(): void {
    this.ruches.clear();
  }
}

// ── Inspection ─────────────────────────────────
export class MockInspectionRepository implements IInspectionRepository {
  private inspections = new Map<string, InspectionEntity>();

  findById(id: string): Promise<InspectionEntity | null> {
    return Promise.resolve(this.inspections.get(id) ?? null);
  }

  findAllByRucheId(
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
    return Promise.resolve({
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    });
  }

  create(inspection: InspectionEntity): Promise<InspectionEntity> {
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
    return Promise.resolve(saved);
  }

  update(id: string, data: Partial<InspectionEntity>): Promise<InspectionEntity> {
    const existing = this.inspections.get(id);
    if (!existing) throw new Error('Inspection not found');
    const ir = data;
    const updated = InspectionEntity.fromPersistence({
      id,
      date: ir.date ?? existing.date,
      etatGeneral: ir.etatGeneral ?? existing.etatGeneral,
      niveauReserve: ir.niveauReserve !== undefined ? ir.niveauReserve : existing.niveauReserve,
      comportement: ir.comportement !== undefined ? ir.comportement : existing.comportement,
      presenceReine: ir.presenceReine !== undefined ? ir.presenceReine : existing.presenceReine,
      nombreCadres: ir.nombreCadres !== undefined ? ir.nombreCadres : existing.nombreCadres,
      presenceMaladie:
        ir.presenceMaladie !== undefined ? ir.presenceMaladie : existing.presenceMaladie,
      descriptionMaladie:
        ir.descriptionMaladie !== undefined ? ir.descriptionMaladie : existing.descriptionMaladie,
      traitementApplique:
        ir.traitementApplique !== undefined ? ir.traitementApplique : existing.traitementApplique,
      recolteKg: ir.recolteKg !== undefined ? ir.recolteKg : existing.recolteKg,
      notes: ir.notes !== undefined ? ir.notes : existing.notes,
      rucheId: existing.rucheId,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.inspections.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.inspections.delete(id);
    return Promise.resolve();
  }

  reset(): void {
    this.inspections.clear();
  }
}
