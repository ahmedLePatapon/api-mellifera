import { CreateRucherHandler } from '@application/rucher/commands/create-rucher.handler';
import { CreateRucherCommand } from '@application/rucher/commands/create-rucher.command';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';

describe('CreateRucherHandler', () => {
    let handler: CreateRucherHandler;
    let rucherRepository: jest.Mocked<IRucherRepository>;

    beforeEach(() => {
        rucherRepository = {
            findById: jest.fn(),
            findAllByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        handler = new CreateRucherHandler(rucherRepository);
    });

    it('should create a rucher successfully', async () => {
        rucherRepository.create.mockImplementation(async (rucher) => rucher);

        const command = new CreateRucherCommand(
            'Rucher des Tilleuls',
            'user-id-1',
            '12 chemin des Abeilles',
            43.6047,
            1.4442,
            'Rucher principal',
        );

        const result = await handler.execute(command);

        expect(rucherRepository.create).toHaveBeenCalled();
        expect(result.nom).toBe('Rucher des Tilleuls');
        expect(result.userId).toBe('user-id-1');
        expect(result.adresse).toBe('12 chemin des Abeilles');
        expect(result.coordonnees).not.toBeNull();
        expect(result.coordonnees!.latitude).toBe(43.6047);
        expect(result.coordonnees!.longitude).toBe(1.4442);
        expect(result.description).toBe('Rucher principal');
    });

    it('should create a rucher without optional fields', async () => {
        rucherRepository.create.mockImplementation(async (rucher) => rucher);

        const command = new CreateRucherCommand('Rucher Simple', 'user-id-1');

        const result = await handler.execute(command);

        expect(result.nom).toBe('Rucher Simple');
        expect(result.adresse).toBeNull();
        expect(result.coordonnees).toBeNull();
        expect(result.description).toBeNull();
    });

    it('should throw if rucher name is empty', async () => {
        const command = new CreateRucherCommand('', 'user-id-1');

        await expect(handler.execute(command)).rejects.toThrow(
            'Rucher nom cannot be empty',
        );
        expect(rucherRepository.create).not.toHaveBeenCalled();
    });
});
