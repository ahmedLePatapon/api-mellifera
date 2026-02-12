import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetRucheQuery } from './get-ruche.query';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetRucheQuery)
export class GetRucheHandler implements IQueryHandler<GetRucheQuery> {
  constructor(
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(query: GetRucheQuery): Promise<RucheEntity> {
    const ruche = await this.rucheRepository.findById(query.id);
    if (!ruche) {
      throw new NotFoundException(`Ruche with id ${query.id} not found`);
    }

    const rucher = await this.rucherRepository.findById(ruche.rucherId);
    if (!rucher || rucher.userId !== query.userId) {
      throw new ForbiddenException('You do not have permission to access this ruche');
    }

    return ruche;
  }
}
