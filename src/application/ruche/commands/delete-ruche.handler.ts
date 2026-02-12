import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRucheCommand } from './delete-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(DeleteRucheCommand)
export class DeleteRucheHandler implements ICommandHandler<DeleteRucheCommand> {
  constructor(
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(command: DeleteRucheCommand): Promise<void> {
    const ruche = await this.rucheRepository.findById(command.id);
    if (!ruche) {
      throw new NotFoundException(`Ruche with id ${command.id} not found`);
    }

    const rucher = await this.rucherRepository.findById(ruche.rucherId);
    if (!rucher || rucher.userId !== command.userId) {
      throw new ForbiddenException('You do not have permission to delete this ruche');
    }

    await this.rucheRepository.delete(command.id);
  }
}
