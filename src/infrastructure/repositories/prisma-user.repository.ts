import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { Email } from '@domain/user/value-objects/email.vo';
import { Role } from '@domain/enums';
import type { User as PrismaUser } from '../../generated/prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<UserEntity | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) return null;

        return this.toDomain(user);
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) return null;

        return this.toDomain(user);
    }

    async create(userEntity: UserEntity): Promise<UserEntity> {
        const user = await this.prisma.user.create({
            data: {
                email: userEntity.email.toString(),
                password: userEntity.password,
                nom: userEntity.nom,
                prenom: userEntity.prenom,
                role: userEntity.role,
            },
        });

        return this.toDomain(user);
    }

    async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
        const updateData: Record<string, unknown> = {};

        if (data.email !== undefined) {
            updateData.email = data.email.toString();
        }
        if (data.password !== undefined) {
            updateData.password = data.password;
        }
        if (data.nom !== undefined) {
            updateData.nom = data.nom;
        }
        if (data.prenom !== undefined) {
            updateData.prenom = data.prenom;
        }
        if (data.role !== undefined) {
            updateData.role = data.role;
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });

        return this.toDomain(user);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }

    private toDomain(user: PrismaUser): UserEntity {
        return UserEntity.fromPersistence({
            id: user.id,
            email: Email.create(user.email),
            password: user.password,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role as Role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
}
