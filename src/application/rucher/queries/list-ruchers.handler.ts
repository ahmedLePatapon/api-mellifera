import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRuchersQuery } from './list-ruchers.query';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { PaginatedResult } from '@shared/types';
import { RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(ListRuchersQuery)
export class ListRuchersHandler implements IQueryHandler<ListRuchersQuery> {
  constructor(
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(query: ListRuchersQuery): Promise<PaginatedResult<RucherEntity>> {
    return this.rucherRepository.findAllByUserId(
      query.userId,
      query.pagination,
      query.sort,
      query.filters,
    );
  }
}
