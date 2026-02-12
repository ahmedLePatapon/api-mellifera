import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListInspectionsQuery } from './list-inspections.query';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { PaginatedResult } from '@shared/types';
import { INSPECTION_REPOSITORY, RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListInspectionsQuery)
export class ListInspectionsHandler implements IQueryHandler<ListInspectionsQuery> {
  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionRepository: IInspectionRepository,
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(query: ListInspectionsQuery): Promise<PaginatedResult<InspectionEntity>> {
    const ruche = await this.rucheRepository.findById(query.rucheId);
    if (!ruche) {
      throw new NotFoundException(`Ruche with id ${query.rucheId} not found`);
    }

    const rucher = await this.rucherRepository.findById(ruche.rucherId);
    if (!rucher || rucher.userId !== query.userId) {
      throw new ForbiddenException(
        'You do not have permission to access inspections of this ruche',
      );
    }

    return this.inspectionRepository.findAllByRucheId(
      query.rucheId,
      query.pagination,
      query.sort,
      query.filters,
    );
  }
}
