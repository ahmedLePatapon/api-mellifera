import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateInspectionHandler } from '@application/inspection/commands/create-inspection.handler';
import { CreateInspectionCommand } from '@application/inspection/commands/create-inspection.command';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { EtatGeneral, TypeRuche, StatutRuche } from '@domain/enums';

describe('CreateInspectionHandler', () => {
    let handler: CreateInspectionHandler;
    let inspectionRepository: jest.Mocked<IInspectionRepository>;
    let rucheRepository: jest.Mocked<IRucheRepository>;
    let rucherRepository: jest.Mocked<IRucherRepository>;

    const mockRucher = RucherEntity.fromPersistence({
        id: 'rucher-id-1',
        nom: 'Test Rucher',
        adresse: null,
        coordonnees: null,
        description: null,
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const mockRuche = RucheEntity.fromPersistence({
        id: 'ruche-id-1',
        nom: 'Test Ruche',
        type: TypeRuche.DADANT,
        statut: StatutRuche.ACTIVE,
        dateAchat: null,
        notes: null,
        rucherId: 'rucher-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    beforeEach(() => {
        inspectionRepository = {
            findById: jest.fn(),
            findAllByRucheId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        rucheRepository = {
            findById: jest.fn(),
            findAllByRucherId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        rucherRepository = {
            findById: jest.fn(),
            findAllByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        handler = new CreateInspectionHandler(
            inspectionRepository,
            rucheRepository,
            rucherRepository,
        );
    });

    it('should create an inspection for an owned ruche', async () => {
        rucheRepository.findById.mockResolvedValue(mockRuche);
        rucherRepository.findById.mockResolvedValue(mockRucher);
        inspectionRepository.create.mockImplementation(async (i) => i);

        const command = new CreateInspectionCommand(
            new Date('2025-06-15'),
            EtatGeneral.BON,
            'ruche-id-1',
            'user-id-1',
        );

        const result = await handler.execute(command);

        expect(rucheRepository.findById).toHaveBeenCalledWith('ruche-id-1');
        expect(rucherRepository.findById).toHaveBeenCalledWith('rucher-id-1');
        expect(inspectionRepository.create).toHaveBeenCalled();
        expect(result.etatGeneral).toBe(EtatGeneral.BON);
        expect(result.rucheId).toBe('ruche-id-1');
    });

    it('should throw NotFoundException if ruche does not exist', async () => {
        rucheRepository.findById.mockResolvedValue(null);

        const command = new CreateInspectionCommand(
            new Date('2025-06-15'),
            EtatGeneral.BON,
            'unknown-ruche',
            'user-id-1',
        );

        await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
        expect(inspectionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if rucher belongs to another user', async () => {
        rucheRepository.findById.mockResolvedValue(mockRuche);
        rucherRepository.findById.mockResolvedValue(mockRucher);

        const command = new CreateInspectionCommand(
            new Date('2025-06-15'),
            EtatGeneral.BON,
            'ruche-id-1',
            'other-user-id',
        );

        await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
        expect(inspectionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if rucher is not found for ruche', async () => {
        rucheRepository.findById.mockResolvedValue(mockRuche);
        rucherRepository.findById.mockResolvedValue(null);

        const command = new CreateInspectionCommand(
            new Date('2025-06-15'),
            EtatGeneral.BON,
            'ruche-id-1',
            'user-id-1',
        );

        await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    });
});
