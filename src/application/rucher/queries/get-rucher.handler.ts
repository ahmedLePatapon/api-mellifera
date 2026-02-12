import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRucherQuery } from './get-rucher.query';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetRucherQuery)
export class GetRucherHandler implements IQueryHandler<GetRucherQuery> {
  constructor(
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(query: GetRucherQuery): Promise<RucherEntity> {
    const rucher = await this.rucherRepository.findById(query.id);
    if (!rucher) {
      throw new NotFoundException(`Rucher with id ${query.id} not found`);
    }

    if (rucher.userId !== query.userId) {
      throw new ForbiddenException('You do not have permission to access this rucher');
    }

    return rucher;
  }
}
