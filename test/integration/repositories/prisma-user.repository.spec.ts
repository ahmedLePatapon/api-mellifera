import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository';
import { UserEntity } from '@domain/user/entities/user.entity';
import { Role } from '@domain/enums';

const shouldRun =
  !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test:test@localhost');

(shouldRun ? describe : describe.skip)('PrismaUserRepository (integration)', () => {
  let prismaService: PrismaService;
  let repository: PrismaUserRepository;
  const testEmail = `integration-test-${Date.now()}@test.com`;

  beforeAll(async () => {
    prismaService = new PrismaService();
    await prismaService.onModuleInit();
    repository = new PrismaUserRepository(prismaService);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const user = await repository.findByEmail(testEmail);
      if (user) await repository.delete(user.id);
    } catch {
      /* ignore */
    }
    await prismaService.onModuleDestroy();
  });

  it('should create a user and find by email', async () => {
    const user = UserEntity.create({
      email: testEmail,
      password: '$2b$12$hashedPasswordPlaceholder1234567890',
      nom: 'Integration',
      prenom: 'Test',
    });

    const created = await repository.create(user);

    expect(created.id).toBeDefined();
    expect(created.id).not.toBe('');
    expect(created.email.toString()).toBe(testEmail);
    expect(created.nom).toBe('Integration');
    expect(created.role).toBe(Role.APICULTEUR);

    const found = await repository.findByEmail(testEmail);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it('should find a user by ID', async () => {
    const user = await repository.findByEmail(testEmail);
    expect(user).not.toBeNull();

    const found = await repository.findById(user!.id);
    expect(found).not.toBeNull();
    expect(found!.email.toString()).toBe(testEmail);
  });

  it('should return null for unknown email', async () => {
    const found = await repository.findByEmail('nonexistent@test.com');
    expect(found).toBeNull();
  });

  it('should return null for unknown ID', async () => {
    const found = await repository.findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });

  it('should delete a user', async () => {
    const user = await repository.findByEmail(testEmail);
    expect(user).not.toBeNull();

    await repository.delete(user!.id);

    const found = await repository.findByEmail(testEmail);
    expect(found).toBeNull();
  });
});
