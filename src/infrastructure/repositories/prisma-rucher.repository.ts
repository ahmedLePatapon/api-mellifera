import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import {
  IRucherRepository,
  RucherFilters,
} from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';
import { PaginatedResult, PaginationParams, SortParams } from '@shared/types';
import type { Rucher as PrismaRucher } from '../../generated/prisma/client';

@Injectable()
export class PrismaRucherRepository implements IRucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RucherEntity | null> {
    const rucher = await this.prisma.rucher.findUnique({
      where: { id },
    });

    if (!rucher) return null;

    return this.toDomain(rucher);
  }

  async findAllByUserId(
    userId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucherFilters,
  ): Promise<PaginatedResult<RucherEntity>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters?.search) {
      where.OR = [
        { nom: { contains: filters.search, mode: 'insensitive' } },
        { adresse: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sort ? { [sort.sortBy]: sort.sortOrder } : { createdAt: 'desc' as const };

    const [ruchers, total] = await Promise.all([
      this.prisma.rucher.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.rucher.count({ where }),
    ]);

    return {
      items: ruchers.map((r) => this.toDomain(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(entity: RucherEntity): Promise<RucherEntity> {
    const rucher = await this.prisma.rucher.create({
      data: {
        nom: entity.nom,
        adresse: entity.adresse,
        latitude: entity.coordonnees?.latitude ?? null,
        longitude: entity.coordonnees?.longitude ?? null,
        description: entity.description,
        userId: entity.userId,
      },
    });

    return this.toDomain(rucher);
  }

  async update(id: string, data: Partial<RucherEntity>): Promise<RucherEntity> {
    const updateData: Record<string, unknown> = {};

    if (data.nom !== undefined) {
      updateData.nom = data.nom;
    }
    if (data.adresse !== undefined) {
      updateData.adresse = data.adresse;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if ('coordonnees' in data) {
      const coordonnees = (data as Record<string, unknown>).coordonnees as CoordonneesGps | null;
      if (coordonnees) {
        updateData.latitude = coordonnees.latitude;
        updateData.longitude = coordonnees.longitude;
      } else {
        updateData.latitude = null;
        updateData.longitude = null;
      }
    }

    const rucher = await this.prisma.rucher.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(rucher);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rucher.delete({
      where: { id },
    });
  }

  private toDomain(rucher: PrismaRucher): RucherEntity {
    let coordonnees: CoordonneesGps | null = null;
    if (rucher.latitude !== null && rucher.longitude !== null) {
      coordonnees = CoordonneesGps.create(rucher.latitude, rucher.longitude);
    }

    return RucherEntity.fromPersistence({
      id: rucher.id,
      nom: rucher.nom,
      adresse: rucher.adresse,
      coordonnees,
      description: rucher.description,
      userId: rucher.userId,
      createdAt: rucher.createdAt,
      updatedAt: rucher.updatedAt,
    });
  }
}
