import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository';
import { PrismaRucherRepository } from '@infrastructure/repositories/prisma-rucher.repository';
import { UserEntity } from '@domain/user/entities/user.entity';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';

const shouldRun =
  !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test:test@localhost');

(shouldRun ? describe : describe.skip)('PrismaRucherRepository (integration)', () => {
  let prismaService: PrismaService;
  let userRepository: PrismaUserRepository;
  let rucherRepository: PrismaRucherRepository;
  let testUserId: string;
  const testEmail = `rucher-integration-${Date.now()}@test.com`;

  beforeAll(async () => {
    prismaService = new PrismaService();
    await prismaService.onModuleInit();
    userRepository = new PrismaUserRepository(prismaService);
    rucherRepository = new PrismaRucherRepository(prismaService);

    // Create a test user
    const user = UserEntity.create({
      email: testEmail,
      password: '$2b$12$hashedPasswordPlaceholder1234567890',
      nom: 'RucherTest',
      prenom: 'Integration',
    });
    const savedUser = await userRepository.create(user);
    testUserId = savedUser.id;
  });

  afterAll(async () => {
    // Clean up: ruchers will be cascade-deleted with user
    try {
      await userRepository.delete(testUserId);
    } catch {
      /* ignore */
    }
    await prismaService.onModuleDestroy();
  });

  it('should create a rucher', async () => {
    const rucher = RucherEntity.create({
      nom: 'Rucher Integration',
      adresse: 'Adresse Test',
      userId: testUserId,
    });

    const created = await rucherRepository.create(rucher);

    expect(created.id).toBeDefined();
    expect(created.nom).toBe('Rucher Integration');
    expect(created.userId).toBe(testUserId);
  });

  it('should list ruchers by userId with pagination', async () => {
    const result = await rucherRepository.findAllByUserId(testUserId, { page: 1, limit: 10 });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('should search ruchers by name', async () => {
    const result = await rucherRepository.findAllByUserId(
      testUserId,
      { page: 1, limit: 10 },
      undefined,
      { search: 'Integration' },
    );

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items.every((r) => r.nom.includes('Integration'))).toBe(true);
  });

  it('should return empty for another user', async () => {
    const result = await rucherRepository.findAllByUserId('00000000-0000-0000-0000-000000000000', {
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should update a rucher', async () => {
    const list = await rucherRepository.findAllByUserId(testUserId, { page: 1, limit: 1 });
    const rucher = list.items[0];

    const updated = await rucherRepository.update(rucher.id, {
      nom: 'Rucher Modifié',
    } as Partial<RucherEntity>);

    expect(updated.nom).toBe('Rucher Modifié');
  });

  it('should delete a rucher', async () => {
    const rucher = RucherEntity.create({
      nom: 'A Supprimer',
      userId: testUserId,
    });
    const created = await rucherRepository.create(rucher);

    await rucherRepository.delete(created.id);

    const found = await rucherRepository.findById(created.id);
    expect(found).toBeNull();
  });
});
