import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetInspectionQuery } from './get-inspection.query';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { INSPECTION_REPOSITORY, RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetInspectionQuery)
export class GetInspectionHandler implements IQueryHandler<GetInspectionQuery> {
  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionRepository: IInspectionRepository,
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(query: GetInspectionQuery): Promise<InspectionEntity> {
    const inspection = await this.inspectionRepository.findById(query.id);
    if (!inspection) {
      throw new NotFoundException(`Inspection with id ${query.id} not found`);
    }

    const ruche = await this.rucheRepository.findById(inspection.rucheId);
    if (!ruche) {
      throw new NotFoundException(`Ruche with id ${inspection.rucheId} not found`);
    }

    const rucher = await this.rucherRepository.findById(ruche.rucherId);
    if (!rucher || rucher.userId !== query.userId) {
      throw new ForbiddenException('You do not have permission to access this inspection');
    }

    return inspection;
  }
}
