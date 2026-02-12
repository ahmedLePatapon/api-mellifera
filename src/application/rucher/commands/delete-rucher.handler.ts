import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteRucherCommand } from './delete-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(DeleteRucherCommand)
export class DeleteRucherHandler implements ICommandHandler<DeleteRucherCommand> {
  constructor(
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
  ) {}

  async execute(command: DeleteRucherCommand): Promise<void> {
    const rucher = await this.rucherRepository.findById(command.id);
    if (!rucher) {
      throw new NotFoundException(`Rucher with id ${command.id} not found`);
    }

    if (rucher.userId !== command.userId) {
      throw new ForbiddenException('You do not have permission to delete this rucher');
    }

    await this.rucherRepository.delete(command.id);
  }
}
