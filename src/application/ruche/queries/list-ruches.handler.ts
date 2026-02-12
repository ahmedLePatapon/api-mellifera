import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListRuchesQuery } from './list-ruches.query';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { PaginatedResult } from '@shared/types';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListRuchesQuery)
export class ListRuchesHandler implements IQueryHandler<ListRuchesQuery> {
  constructor(
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(query: ListRuchesQuery): Promise<PaginatedResult<RucheEntity>> {
    const rucher = await this.rucherRepository.findById(query.rucherId);
    if (!rucher) {
      throw new NotFoundException(`Rucher with id ${query.rucherId} not found`);
    }

    if (rucher.userId !== query.userId) {
      throw new ForbiddenException('You do not have permission to access ruches of this rucher');
    }

    return this.rucheRepository.findAllByRucherId(
      query.rucherId,
      query.pagination,
      query.sort,
      query.filters,
    );
  }
}
