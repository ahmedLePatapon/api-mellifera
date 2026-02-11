import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
    imports: [AppConfigModule, PrismaModule, CqrsModule.forRoot()],
    controllers: [],
    providers: [],
})
export class AppModule { }
