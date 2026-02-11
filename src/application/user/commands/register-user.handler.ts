import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterUserCommand } from './register-user.command';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { USER_REPOSITORY } from '@shared/constants';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
    implements ICommandHandler<RegisterUserCommand> {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: RegisterUserCommand): Promise<UserEntity> {
        const existingUser = await this.userRepository.findByEmail(
            command.email,
        );
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(command.password, 12);

        const user = UserEntity.create({
            email: command.email,
            password: hashedPassword,
            nom: command.nom,
            prenom: command.prenom,
            role: command.role,
        });

        return this.userRepository.create(user);
    }
}
