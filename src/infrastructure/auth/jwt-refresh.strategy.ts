import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@interfaces/common/decorators/current-user.decorator';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken') as any,
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    validate(payload: JwtPayload & { type?: string }): JwtPayload {
        if (!payload.sub || !payload.email) {
            throw new UnauthorizedException('Invalid refresh token payload');
        }
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException('Token is not a refresh token');
        }
        return { sub: payload.sub, email: payload.email, role: payload.role };
    }
}
