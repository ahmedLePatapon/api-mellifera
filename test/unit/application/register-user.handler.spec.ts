import { ConflictException } from '@nestjs/common';
import { RegisterUserHandler } from '@application/user/commands/register-user.handler';
import { RegisterUserCommand } from '@application/user/commands/register-user.command';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { Email } from '@domain/user/value-objects/email.vo';
import { Role } from '@domain/enums';

describe('RegisterUserHandler', () => {
  let handler: RegisterUserHandler;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    handler = new RegisterUserHandler(userRepository);
  });

  it('should register a new user with hashed password', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const command = new RegisterUserCommand('test@example.com', 'Password123!', 'Dupont', 'Jean');

    const result = await handler.execute(command);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(userRepository.create).toHaveBeenCalled();
    expect(result.nom).toBe('Dupont');
    expect(result.prenom).toBe('Jean');
    expect(result.email.toString()).toBe('test@example.com');
    // Password must be hashed, not plain text
    expect(result.password).not.toBe('Password123!');
    expect(result.password).toMatch(/^\$2[aby]\$/);
  });

  it('should throw ConflictException if email already exists', async () => {
    const existingUser = UserEntity.fromPersistence({
      id: 'existing-id',
      email: Email.create('test@example.com'),
      password: 'hashed',
      nom: 'Existant',
      prenom: 'User',
      role: Role.APICULTEUR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userRepository.findByEmail.mockResolvedValue(existingUser);

    const command = new RegisterUserCommand('test@example.com', 'Password123!', 'Dupont', 'Jean');

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('should assign APICULTEUR role by default', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user) => user);

    const command = new RegisterUserCommand('test@example.com', 'Password123!', 'Dupont', 'Jean');

    const result = await handler.execute(command);
    expect(result.role).toBe(Role.APICULTEUR);
  });
});
