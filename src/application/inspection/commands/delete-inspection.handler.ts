import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteInspectionCommand } from './delete-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import {
    INSPECTION_REPOSITORY,
    RUCHE_REPOSITORY,
    RUCHER_REPOSITORY,
} from '@shared/constants';

@CommandHandler(DeleteInspectionCommand)
export class DeleteInspectionHandler
    implements ICommandHandler<DeleteInspectionCommand> {
    constructor(
        @Inject(INSPECTION_REPOSITORY)
        private readonly inspectionRepository: IInspectionRepository,
        @Inject(RUCHE_REPOSITORY)
        private readonly rucheRepository: IRucheRepository,
        @Inject(RUCHER_REPOSITORY)
        private readonly rucherRepository: IRucherRepository,
    ) { }

    async execute(command: DeleteInspectionCommand): Promise<void> {
        const inspection = await this.inspectionRepository.findById(
            command.id,
        );
        if (!inspection) {
            throw new NotFoundException(
                `Inspection with id ${command.id} not found`,
            );
        }

        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) {
            throw new NotFoundException(
                `Ruche with id ${inspection.rucheId} not found`,
            );
        }

        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        if (!rucher || rucher.userId !== command.userId) {
            throw new ForbiddenException(
                'You do not have permission to delete this inspection',
            );
        }

        await this.inspectionRepository.delete(command.id);
    }
}
