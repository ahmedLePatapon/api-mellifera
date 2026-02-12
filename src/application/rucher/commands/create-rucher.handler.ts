import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateRucherCommand } from './create-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateRucherCommand)
export class CreateRucherHandler implements ICommandHandler<CreateRucherCommand> {
  constructor(
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(command: CreateRucherCommand): Promise<RucherEntity> {
    const rucher = RucherEntity.create({
      nom: command.nom,
      adresse: command.adresse,
      latitude: command.latitude,
      longitude: command.longitude,
      description: command.description,
      userId: command.userId,
    });

    return this.rucherRepository.create(rucher);
  }
}
