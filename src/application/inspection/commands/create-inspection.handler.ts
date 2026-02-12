import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInspectionCommand } from './create-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { INSPECTION_REPOSITORY, RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateInspectionCommand)
export class CreateInspectionHandler implements ICommandHandler<CreateInspectionCommand> {
  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionRepository: IInspectionRepository,
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(command: CreateInspectionCommand): Promise<InspectionEntity> {
    const ruche = await this.rucheRepository.findById(command.rucheId);
    if (!ruche) {
      throw new NotFoundException(`Ruche with id ${command.rucheId} not found`);
    }

    const rucher = await this.rucherRepository.findById(ruche.rucherId);
    if (!rucher || rucher.userId !== command.userId) {
      throw new ForbiddenException('You do not have permission to add an inspection to this ruche');
    }

    const inspection = InspectionEntity.create({
      date: command.date,
      etatGeneral: command.etatGeneral,
      niveauReserve: command.niveauReserve,
      comportement: command.comportement,
      presenceReine: command.presenceReine,
      nombreCadres: command.nombreCadres,
      presenceMaladie: command.presenceMaladie,
      descriptionMaladie: command.descriptionMaladie,
      traitementApplique: command.traitementApplique,
      recolteKg: command.recolteKg,
      notes: command.notes,
      rucheId: command.rucheId,
    });

    return this.inspectionRepository.create(inspection);
  }
}
