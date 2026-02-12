import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
  IInspectionRepository,
  InspectionFilters,
} from '@domain/inspection/repositories/inspection.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';
import { PaginatedResult, PaginationParams, SortParams } from '@shared/types';
import type { Inspection as PrismaInspection } from '../../generated/prisma/client';

@Injectable()
export class PrismaInspectionRepository implements IInspectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<InspectionEntity | null> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
    });

    if (!inspection) return null;

    return this.toDomain(inspection);
  }

  async findAllByRucheId(
    rucheId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: InspectionFilters,
  ): Promise<PaginatedResult<InspectionEntity>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { rucheId };

    if (filters?.etatGeneral) {
      where.etatGeneral = filters.etatGeneral;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) {
        dateFilter.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        dateFilter.lte = filters.dateTo;
      }
      where.date = dateFilter;
    }

    const orderBy = sort ? { [sort.sortBy]: sort.sortOrder } : { date: 'desc' as const };

    const [inspections, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.inspection.count({ where }),
    ]);

    return {
      items: inspections.map((i) => this.toDomain(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(entity: InspectionEntity): Promise<InspectionEntity> {
    const inspection = await this.prisma.inspection.create({
      data: {
        date: entity.date,
        etatGeneral: entity.etatGeneral,
        niveauReserve: entity.niveauReserve,
        comportement: entity.comportement,
        presenceReine: entity.presenceReine,
        nombreCadres: entity.nombreCadres,
        presenceMaladie: entity.presenceMaladie,
        descriptionMaladie: entity.descriptionMaladie,
        traitementApplique: entity.traitementApplique,
        recolteKg: entity.recolteKg,
        notes: entity.notes,
        rucheId: entity.rucheId,
      },
    });

    return this.toDomain(inspection);
  }

  async update(id: string, data: Partial<InspectionEntity>): Promise<InspectionEntity> {
    const updateData: Record<string, unknown> = {};

    if (data.date !== undefined) {
      updateData.date = data.date;
    }
    if (data.etatGeneral !== undefined) {
      updateData.etatGeneral = data.etatGeneral;
    }
    if (data.niveauReserve !== undefined) {
      updateData.niveauReserve = data.niveauReserve;
    }
    if (data.comportement !== undefined) {
      updateData.comportement = data.comportement;
    }
    if (data.presenceReine !== undefined) {
      updateData.presenceReine = data.presenceReine;
    }
    if (data.nombreCadres !== undefined) {
      updateData.nombreCadres = data.nombreCadres;
    }
    if (data.presenceMaladie !== undefined) {
      updateData.presenceMaladie = data.presenceMaladie;
    }
    if (data.descriptionMaladie !== undefined) {
      updateData.descriptionMaladie = data.descriptionMaladie;
    }
    if (data.traitementApplique !== undefined) {
      updateData.traitementApplique = data.traitementApplique;
    }
    if (data.recolteKg !== undefined) {
      updateData.recolteKg = data.recolteKg;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const inspection = await this.prisma.inspection.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(inspection);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inspection.delete({
      where: { id },
    });
  }

  private toDomain(inspection: PrismaInspection): InspectionEntity {
    return InspectionEntity.fromPersistence({
      id: inspection.id,
      date: inspection.date,
      etatGeneral: inspection.etatGeneral as EtatGeneral,
      niveauReserve: (inspection.niveauReserve as NiveauReserve) ?? null,
      comportement: (inspection.comportement as Comportement) ?? null,
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
  }
}
