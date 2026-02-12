import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateRucherCommand } from './update-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { CoordonneesGps } from '@domain/rucher/value-objects/coordonnees-gps.vo';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateRucherCommand)
export class UpdateRucherHandler implements ICommandHandler<UpdateRucherCommand> {
  constructor(
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(command: UpdateRucherCommand): Promise<RucherEntity> {
    const rucher = await this.rucherRepository.findById(command.id);
    if (!rucher) {
      throw new NotFoundException(`Rucher with id ${command.id} not found`);
    }

    if (rucher.userId !== command.userId) {
      throw new ForbiddenException('You do not have permission to update this rucher');
    }

    const updateData: Partial<RucherEntity> = {};

    if (command.nom !== undefined) {
      if (!command.nom || command.nom.trim().length === 0) {
        throw new Error('Rucher nom cannot be empty');
      }
      (updateData as Record<string, unknown>).nom = command.nom.trim();
    }

    if (command.adresse !== undefined) {
      (updateData as Record<string, unknown>).adresse = command.adresse?.trim() ?? null;
    }

    if (command.description !== undefined) {
      (updateData as Record<string, unknown>).description = command.description?.trim() ?? null;
    }

    if (command.latitude !== undefined && command.longitude !== undefined) {
      if (command.latitude !== null && command.longitude !== null) {
        (updateData as Record<string, unknown>).coordonnees = CoordonneesGps.create(
          command.latitude,
          command.longitude,
        );
      } else {
        (updateData as Record<string, unknown>).coordonnees = null;
      }
    }

    return this.rucherRepository.update(command.id, updateData);
  }
}
