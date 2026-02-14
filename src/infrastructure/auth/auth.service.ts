import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IUserRepository } from '@domain/user/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '@domain/user/repositories/refresh-token.repository.interface';
import { UserEntity } from '@domain/user/entities/user.entity';
import { RefreshTokenEntity } from '@domain/user/entities/refresh-token.entity';
import { USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY } from '@shared/constants';
import { JwtPayload } from '@interfaces/common/decorators/current-user.decorator';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    nom: string,
    prenom: string,
  ): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = UserEntity.create({
      email,
      password: hashedPassword,
      nom,
      prenom,
    });

    const savedUser = await this.userRepository.create(user);
    const tokens = await this.generateTokens(savedUser);

    return this.buildAuthResponse(savedUser, tokens);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return this.buildAuthResponse(user, tokens);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.refreshTokenRepository.findByToken(tokenHash);
    if (!storedToken || !storedToken.isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the old refresh token (rotation)
    await this.refreshTokenRepository.revokeByToken(tokenHash);

    // Verify the JWT to extract the payload
    let payload: JwtPayload & { type?: string };
    try {
      payload = this.jwtService.verify<JwtPayload & { type?: string }>(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByToken(tokenHash);

    if (storedToken && storedToken.isValid) {
      await this.refreshTokenRepository.revokeByToken(tokenHash);
    }
  }

  async validateUser(userId: string): Promise<UserEntity | null> {
    return this.userRepository.findById(userId);
  }

  private async generateTokens(user: UserEntity): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email.toString(),
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload as Record<string, unknown>, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration') ?? '15m',
    });

    const refreshPayload = { ...payload, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshPayload as Record<string, unknown>, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration') ?? '7d',
    });

    // Store the refresh token hash in DB
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.calculateRefreshExpiry();

    const refreshTokenEntity = RefreshTokenEntity.create({
      token: tokenHash,
      userId: user.id,
      expiresAt,
    });

    await this.refreshTokenRepository.create(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  private buildAuthResponse(user: UserEntity, tokens: AuthTokens): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email.toString(),
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
      tokens,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private calculateRefreshExpiry(): Date {
    const expiration = this.configService.get<string>('jwt.refreshExpiration') ?? '7d';
    const match = expiration.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
