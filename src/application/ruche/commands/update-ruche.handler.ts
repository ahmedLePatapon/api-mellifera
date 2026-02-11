import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateRucheCommand } from './update-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(UpdateRucheCommand)
export class UpdateRucheHandler
    implements ICommandHandler<UpdateRucheCommand> {
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) { }

    async execute(command: UpdateRucheCommand): Promise<RucheEntity> {
        const ruche = await this.rucheRepository.findById(command.id);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${command.id} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to update this ruche',
            );
        }

        const updateData: Partial<RucheEntity> = {};

        if (command.nom !== undefined) {
            if (!command.nom || command.nom.trim().length === 0) {
                throw new Error('Ruche nom cannot be empty');
            }
            (updateData as Record<string, unknown>).nom = command.nom.trim();
        }

        if (command.type !== undefined) {
            (updateData as Record<string, unknown>).type = command.type;
        }

        if (command.statut !== undefined) {
            (updateData as Record<string, unknown>).statut = command.statut;
        }

        if (command.dateAchat !== undefined) {
            (updateData as Record<string, unknown>).dateAchat =
                command.dateAchat ?? null;
        }

        if (command.notes !== undefined) {
            (updateData as Record<string, unknown>).notes =
                command.notes?.trim() ?? null;
        }

        return this.rucheRepository.update(command.id, updateData);
    }
}
