import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateRucheHandler } from '@application/ruche/commands/create-ruche.handler';
import { CreateRucheCommand } from '@application/ruche/commands/create-ruche.command';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { TypeRuche, StatutRuche } from '@domain/enums';

describe('CreateRucheHandler', () => {
    let handler: CreateRucheHandler;
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

    beforeEach(() => {
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
        handler = new CreateRucheHandler(rucheRepository, rucherRepository);
    });

    it('should create a ruche in an owned rucher', async () => {
        rucherRepository.findById.mockResolvedValue(mockRucher);
        rucheRepository.create.mockImplementation(async (ruche) => ruche);

        const command = new CreateRucheCommand(
            'Ruche Alpha',
            'rucher-id-1',
            'user-id-1',
            TypeRuche.DADANT,
            StatutRuche.ACTIVE,
        );

        const result = await handler.execute(command);

        expect(rucherRepository.findById).toHaveBeenCalledWith('rucher-id-1');
        expect(rucheRepository.create).toHaveBeenCalled();
        expect(result.nom).toBe('Ruche Alpha');
        expect(result.type).toBe(TypeRuche.DADANT);
        expect(result.rucherId).toBe('rucher-id-1');
    });

    it('should throw NotFoundException if rucher does not exist', async () => {
        rucherRepository.findById.mockResolvedValue(null);

        const command = new CreateRucheCommand(
            'Ruche Alpha',
            'unknown-rucher',
            'user-id-1',
        );

        await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
        expect(rucheRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if rucher belongs to another user', async () => {
        rucherRepository.findById.mockResolvedValue(mockRucher);

        const command = new CreateRucheCommand(
            'Ruche Alpha',
            'rucher-id-1',
            'other-user-id',
        );

        await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
        expect(rucheRepository.create).not.toHaveBeenCalled();
    });
});
