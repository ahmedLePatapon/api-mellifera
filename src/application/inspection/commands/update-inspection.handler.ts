import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateInspectionCommand } from './update-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { INSPECTION_REPOSITORY, RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateInspectionCommand)
export class UpdateInspectionHandler implements ICommandHandler<UpdateInspectionCommand> {
  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionRepository: IInspectionRepository,
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(command: UpdateInspectionCommand): Promise<InspectionEntity> {
    const inspection = await this.inspectionRepository.findById(command.id);
    if (!inspection) {
      throw new NotFoundException(`Inspection with id ${command.id} not found`);
    }

    const ruche = await this.rucheRepository.findById(inspection.rucheId);
    if (!ruche) {
      throw new NotFoundException(`Ruche with id ${inspection.rucheId} not found`);
    }

    const rucher = await this.rucherRepository.findById(ruche.rucherId);
    if (!rucher || rucher.userId !== command.userId) {
      throw new ForbiddenException('You do not have permission to update this inspection');
    }

    const updateData: Partial<InspectionEntity> = {};

    if (command.date !== undefined) {
      (updateData as Record<string, unknown>).date = command.date;
    }

    if (command.etatGeneral !== undefined) {
      (updateData as Record<string, unknown>).etatGeneral = command.etatGeneral;
    }

    if (command.niveauReserve !== undefined) {
      (updateData as Record<string, unknown>).niveauReserve = command.niveauReserve ?? null;
    }

    if (command.comportement !== undefined) {
      (updateData as Record<string, unknown>).comportement = command.comportement ?? null;
    }

    if (command.presenceReine !== undefined) {
      (updateData as Record<string, unknown>).presenceReine = command.presenceReine ?? null;
    }

    if (command.nombreCadres !== undefined) {
      if (
        command.nombreCadres !== null &&
        command.nombreCadres !== undefined &&
        command.nombreCadres < 0
      ) {
        throw new Error('Inspection nombreCadres cannot be negative');
      }
      (updateData as Record<string, unknown>).nombreCadres = command.nombreCadres ?? null;
    }

    if (command.presenceMaladie !== undefined) {
      (updateData as Record<string, unknown>).presenceMaladie = command.presenceMaladie ?? null;
    }

    if (command.descriptionMaladie !== undefined) {
      (updateData as Record<string, unknown>).descriptionMaladie =
        command.descriptionMaladie?.trim() ?? null;
    }

    if (command.traitementApplique !== undefined) {
      (updateData as Record<string, unknown>).traitementApplique =
        command.traitementApplique?.trim() ?? null;
    }

    if (command.recolteKg !== undefined) {
      if (command.recolteKg !== null && command.recolteKg !== undefined && command.recolteKg < 0) {
        throw new Error('Inspection recolteKg cannot be negative');
      }
      (updateData as Record<string, unknown>).recolteKg = command.recolteKg ?? null;
    }

    if (command.notes !== undefined) {
      (updateData as Record<string, unknown>).notes = command.notes?.trim() ?? null;
    }

    return this.inspectionRepository.update(command.id, updateData);
  }
}
