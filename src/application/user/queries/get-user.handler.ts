import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { USER_REPOSITORY } from '@shared/constants';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(query: GetUserQuery): Promise<UserEntity> {
        const user = await this.userRepository.findById(query.userId);
        if (!user) {
            throw new NotFoundException(`User with id ${query.userId} not found`);
        }
        return user;
    }
}
