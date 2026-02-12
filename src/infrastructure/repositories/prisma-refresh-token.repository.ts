import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { IRefreshTokenRepository } from '@domain/user/repositories/refresh-token.repository.interface';
import { RefreshTokenEntity } from '@domain/user/entities/refresh-token.entity';
import type { RefreshToken as PrismaRefreshToken } from '../../generated/prisma/client';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token: entity.token,
        userId: entity.userId,
        expiresAt: entity.expiresAt,
      },
    });

    return this.toDomain(refreshToken);
  }

  async findByToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!refreshToken) return null;

    return this.toDomain(refreshToken);
  }

  async revokeByToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token: tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  private toDomain(token: PrismaRefreshToken): RefreshTokenEntity {
    return RefreshTokenEntity.fromPersistence({
      id: token.id,
      token: token.token,
      userId: token.userId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
    });
  }
}
