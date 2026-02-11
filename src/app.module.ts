import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

import {
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    RUCHER_REPOSITORY,
    RUCHE_REPOSITORY,
    INSPECTION_REPOSITORY,
} from './shared/constants';

import {
    PrismaUserRepository,
    PrismaRefreshTokenRepository,
    PrismaRucherRepository,
    PrismaRucheRepository,
    PrismaInspectionRepository,
} from './infrastructure/repositories';

import {
    RegisterUserHandler,
    GetUserHandler,
    CreateRucherHandler,
    UpdateRucherHandler,
    DeleteRucherHandler,
    ListRuchersHandler,
    GetRucherHandler,
    CreateRucheHandler,
    UpdateRucheHandler,
    DeleteRucheHandler,
    ListRuchesHandler,
    GetRucheHandler,
    CreateInspectionHandler,
    UpdateInspectionHandler,
    DeleteInspectionHandler,
    ListInspectionsHandler,
    GetInspectionHandler,
} from './application';

const CommandHandlers = [
    RegisterUserHandler,
    CreateRucherHandler,
    UpdateRucherHandler,
    DeleteRucherHandler,
    CreateRucheHandler,
    UpdateRucheHandler,
    DeleteRucheHandler,
    CreateInspectionHandler,
    UpdateInspectionHandler,
    DeleteInspectionHandler,
];

const QueryHandlers = [
    GetUserHandler,
    ListRuchersHandler,
    GetRucherHandler,
    ListRuchesHandler,
    GetRucheHandler,
    ListInspectionsHandler,
    GetInspectionHandler,
];

const RepositoryProviders = [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: RUCHER_REPOSITORY, useClass: PrismaRucherRepository },
    { provide: RUCHE_REPOSITORY, useClass: PrismaRucheRepository },
    { provide: INSPECTION_REPOSITORY, useClass: PrismaInspectionRepository },
];

@Module({
    imports: [AppConfigModule, PrismaModule, CqrsModule.forRoot()],
    controllers: [],
    providers: [
        ...RepositoryProviders,
        ...CommandHandlers,
        ...QueryHandlers,
    ],
})
export class AppModule { }
