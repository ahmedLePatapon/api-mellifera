import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY } from '@shared/constants';
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from '@infrastructure/repositories/prisma-refresh-token.repository';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('jwt.secret');
                const expiresIn = configService.get<string>('jwt.accessExpiration') ?? '15m';
                return ({ secret, signOptions: { expiresIn } } as any);
            },
        }),
    ],
    providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshStrategy,
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    ],
    exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule { }
