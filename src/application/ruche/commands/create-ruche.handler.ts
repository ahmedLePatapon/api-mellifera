import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateRucheCommand } from './create-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RUCHE_REPOSITORY, RUCHER_REPOSITORY } from '@shared/constants';

@CommandHandler(CreateRucheCommand)
export class CreateRucheHandler
    implements ICommandHandler<CreateRucheCommand> {
    constructor(
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) { }

    async execute(command: CreateRucheCommand): Promise<RucheEntity> {
        const rucher = await this.rucherRepository.findById(command.rucherId);
        if (!rucher) {
            throw new NotFoundException(
                `Rucher with id ${command.rucherId} not found`,
            );
        }

        if (rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to add a ruche to this rucher',
            );
        }

        const ruche = RucheEntity.create({
            nom: command.nom,
            type: command.type,
            statut: command.statut,
            dateAchat: command.dateAchat,
            notes: command.notes,
            rucherId: command.rucherId,
        });

        return this.rucheRepository.create(ruche);
    }
}
