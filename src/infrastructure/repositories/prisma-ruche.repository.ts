import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
  IRucheRepository,
  RucheFilters,
} from '@domain/ruche/repositories/ruche.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { TypeRuche, StatutRuche } from '@domain/enums';
import { PaginatedResult, PaginationParams, SortParams } from '@shared/types';
import type { Ruche as PrismaRuche } from '../../generated/prisma/client';

@Injectable()
export class PrismaRucheRepository implements IRucheRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RucheEntity | null> {
    const ruche = await this.prisma.ruche.findUnique({
      where: { id },
    });

    if (!ruche) return null;

    return this.toDomain(ruche);
  }

  async findAllByRucherId(
    rucherId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucheFilters,
  ): Promise<PaginatedResult<RucheEntity>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { rucherId };

    if (filters?.statut) {
      where.statut = filters.statut;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    const orderBy = sort ? { [sort.sortBy]: sort.sortOrder } : { createdAt: 'desc' as const };

    const [ruches, total] = await Promise.all([
      this.prisma.ruche.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.ruche.count({ where }),
    ]);

    return {
      items: ruches.map((r) => this.toDomain(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(entity: RucheEntity): Promise<RucheEntity> {
    const ruche = await this.prisma.ruche.create({
      data: {
        nom: entity.nom,
        type: entity.type,
        statut: entity.statut,
        dateAchat: entity.dateAchat,
        notes: entity.notes,
        rucherId: entity.rucherId,
      },
    });

    return this.toDomain(ruche);
  }

  async update(id: string, data: Partial<RucheEntity>): Promise<RucheEntity> {
    const updateData: Record<string, unknown> = {};

    if (data.nom !== undefined) {
      updateData.nom = data.nom;
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.statut !== undefined) {
      updateData.statut = data.statut;
    }
    if (data.dateAchat !== undefined) {
      updateData.dateAchat = data.dateAchat;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const ruche = await this.prisma.ruche.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(ruche);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ruche.delete({
      where: { id },
    });
  }

  private toDomain(ruche: PrismaRuche): RucheEntity {
    return RucheEntity.fromPersistence({
      id: ruche.id,
      nom: ruche.nom,
      type: ruche.type as TypeRuche,
      statut: ruche.statut as StatutRuche,
      dateAchat: ruche.dateAchat,
      notes: ruche.notes,
      rucherId: ruche.rucherId,
      createdAt: ruche.createdAt,
      updatedAt: ruche.updatedAt,
    });
  }
}
