# Step 6 — Authentification JWT avec Refresh Tokens & Sécurité

## Goal

Mettre en place l'authentification complète avec JWT access tokens (15 min) et refresh tokens (7 jours) avec rotation, révocation, strategies Passport, guards, decorators, DTOs, et le contrôleur REST auth — tout intégré dans l'architecture existante.

## Prerequisites

- Steps 1–5 complétées (NestJS init, Prisma schema, Domaine, Application CQRS, Repositories Prisma)
- `npm run build` compile sans erreur
- Branche `feat/api-mellifera-init`

---

### Step-by-Step Instructions

---

#### Step 6.1 : Créer le `@CurrentUser()` decorator et les types JWT payload

- [x] Créer `src/interfaces/common/decorators/current-user.decorator.ts` :

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (data) {
      return user[data];
    }

    return user;
  },
);
```

- [x] Créer `src/interfaces/common/decorators/index.ts` :

```typescript
export { CurrentUser, JwtPayload } from './current-user.decorator';
```

- [x] Créer `src/interfaces/common/index.ts` :

```typescript
export { CurrentUser, JwtPayload } from './decorators';
```

##### Step 6.1 Verification Checklist

- [ ] `npm run build` compile sans erreur

#### Step 6.1 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.2 : Créer les Strategies Passport (JWT Access & Refresh)

- [x] Créer `src/infrastructure/auth/jwt.strategy.ts` :

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@interfaces/common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
```

- [x] Créer `src/infrastructure/auth/jwt-refresh.strategy.ts` :

```typescript
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
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
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
```

##### Step 6.2 Verification Checklist

- [x] `npm run build` compile sans erreur

#### Step 6.2 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.3 : Créer les Guards JWT (Access & Refresh)

- [x] Créer `src/infrastructure/auth/jwt-auth.guard.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [x] Créer `src/infrastructure/auth/jwt-refresh-auth.guard.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
```

##### Step 6.3 Verification Checklist

- [x] `npm run build` compile sans erreur

#### Step 6.3 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.4 : Créer le `AuthService`

- [x] Créer `src/infrastructure/auth/auth.service.ts` :

```typescript
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

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration'),
    });

    const refreshPayload = { ...payload, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
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
```

##### Step 6.4 Verification Checklist

- [x] `npm run build` compile sans erreur

#### Step 6.4 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.5 : Créer le `AuthModule` (infrastructure)

- [x] Créer `src/infrastructure/auth/index.ts` :

```typescript
export { AuthModule } from './auth.module';
export { AuthService, AuthTokens, AuthResponse } from './auth.service';
export { JwtStrategy } from './jwt.strategy';
export { JwtRefreshStrategy } from './jwt-refresh.strategy';
export { JwtAuthGuard } from './jwt-auth.guard';
export { JwtRefreshAuthGuard } from './jwt-refresh-auth.guard';
```

- [x] Créer `src/infrastructure/auth/auth.module.ts` :

```typescript
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
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiration'),
        },
      }),
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
export class AuthModule {}
```

##### Step 6.5 Verification Checklist

- [x] `npm run build` compile sans erreur

#### Step 6.5 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.6 : Créer les DTOs Auth

- [ ] Créer `src/interfaces/auth/dto/register.dto.ts` :

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'apiculteur@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email!: string;

  @ApiProperty({
    example: 'MonMotDePasse123!',
    description: 'Mot de passe (minimum 8 caractères)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne doit pas dépasser 128 caractères' })
  password!: string;

  @ApiProperty({
    example: 'Dupont',
    description: "Nom de famille de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100)
  nom!: string;

  @ApiProperty({
    example: 'Jean',
    description: "Prénom de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MaxLength(100)
  prenom!: string;
}
```

- [ ] Créer `src/interfaces/auth/dto/login.dto.ts` :

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'apiculteur@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email!: string;

  @ApiProperty({
    example: 'MonMotDePasse123!',
    description: "Mot de passe de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password!: string;
}
```

- [ ] Créer `src/interfaces/auth/dto/refresh-token.dto.ts` :

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Le refresh token à utiliser pour obtenir un nouveau couple de tokens',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refreshToken!: string;
}
```

- [ ] Créer `src/interfaces/auth/dto/index.ts` :
- [x] Créer `src/interfaces/auth/dto/register.dto.ts` :

- [x] Créer `src/interfaces/auth/dto/login.dto.ts` :

- [x] Créer `src/interfaces/auth/dto/refresh-token.dto.ts` :

- [x] Créer `src/interfaces/auth/dto/index.ts` :

```typescript
export { RegisterDto } from './register.dto';
export { LoginDto } from './login.dto';
export { RefreshTokenDto } from './refresh-token.dto';
```

##### Step 6.6 Verification Checklist

- [x] `npm run build` compile sans erreur

#### Step 6.6 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.7 : Créer le `AuthController`

- [x] Créer `src/interfaces/auth/auth.controller.ts` :

```typescript
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, AuthResponse, AuthTokens } from '@infrastructure/auth/auth.service';
import { JwtRefreshAuthGuard } from '@infrastructure/auth/jwt-refresh-auth.guard';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '@interfaces/common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès. Retourne les tokens.',
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto.email, dto.password, dto.nom, dto.prenom);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter et obtenir les tokens' })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie. Retourne access + refresh tokens.',
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens avec un refresh token valide' })
  @ApiResponse({
    status: 200,
    description: 'Tokens rafraîchis avec succès.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter et révoquer le refresh token' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie.' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() _user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logout successful' };
  }
}
```

- [x] Créer `src/interfaces/auth/index.ts` :

```typescript
export { AuthController } from './auth.controller';
```

##### Step 6.7 Verification Checklist

- [x] `npm run build` compile sans erreur

#### Step 6.7 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.8 : Créer le `OwnershipGuard`

- [x] Créer `src/interfaces/common/guards/ownership.guard.ts` :

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '@interfaces/common/decorators/current-user.decorator';
import { IRucherRepository } from '@domain/rucher/repositories/rucher.repository.interface';
import { IRucheRepository } from '@domain/ruche/repositories/ruche.repository.interface';
import { IInspectionRepository } from '@domain/inspection/repositories/inspection.repository.interface';
import { RUCHER_REPOSITORY, RUCHE_REPOSITORY, INSPECTION_REPOSITORY } from '@shared/constants';

export const RESOURCE_TYPE_KEY = 'resourceType';

export type ResourceType = 'rucher' | 'ruche' | 'inspection';

export function SetResourceType(type: ResourceType): ClassDecorator & MethodDecorator {
  return (
    target: object,
    _propertyKey?: string | symbol,
    _descriptor?: TypedPropertyDescriptor<unknown>,
  ): void => {
    Reflect.defineMetadata(RESOURCE_TYPE_KEY, type, _descriptor?.value ?? target);
  };
}

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RUCHER_REPOSITORY)
    private readonly rucherRepository: IRucherRepository,
    @Inject(RUCHE_REPOSITORY)
    private readonly rucheRepository: IRucheRepository,
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspectionRepository: IInspectionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: JwtPayload;
      params: Record<string, string>;
    }>();
    const user = request.user;
    const params = request.params;

    const resourceType = this.reflector.getAllAndOverride<ResourceType | undefined>(
      RESOURCE_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resourceType) {
      return true;
    }

    const resourceId = params['id'];
    if (!resourceId) {
      return true;
    }

    const isOwner = await this.checkOwnership(resourceType, resourceId, user.sub);
    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }

  private async checkOwnership(
    type: ResourceType,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    switch (type) {
      case 'rucher': {
        const rucher = await this.rucherRepository.findById(resourceId);
        return rucher?.userId === userId;
      }
      case 'ruche': {
        const ruche = await this.rucheRepository.findById(resourceId);
        if (!ruche) return false;
        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        return rucher?.userId === userId;
      }
      case 'inspection': {
        const inspection = await this.inspectionRepository.findById(resourceId);
        if (!inspection) return false;
        const ruche = await this.rucheRepository.findById(inspection.rucheId);
        if (!ruche) return false;
        const rucher = await this.rucherRepository.findById(ruche.rucherId);
        return rucher?.userId === userId;
      }
      default:
        return false;
    }
  }
}
```

- [x] Créer `src/interfaces/common/guards/index.ts` :

```typescript
export { OwnershipGuard, SetResourceType, RESOURCE_TYPE_KEY } from './ownership.guard';
export type { ResourceType } from './ownership.guard';
```

- [x] Mettre à jour `src/interfaces/common/index.ts` pour ajouter l'export des guards :

```typescript
export { CurrentUser, JwtPayload } from './decorators';
export { OwnershipGuard, SetResourceType, RESOURCE_TYPE_KEY } from './guards';
export type { ResourceType } from './guards';
```

##### Step 6.8 Verification Checklist

- [ ] `npm run build` compile sans erreur

#### Step 6.8 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.9 : Intégrer le `AuthModule` dans `AppModule`

- [ ] Remplacer le contenu de `src/app.module.ts` par :

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { AuthController } from './interfaces/auth/auth.controller';

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
  imports: [AppConfigModule, PrismaModule, CqrsModule.forRoot(), AuthModule],
  controllers: [AuthController],
  providers: [...RepositoryProviders, ...CommandHandlers, ...QueryHandlers],
})
export class AppModule {}
```

##### Step 6.9 Verification Checklist

- [x] `npm run build` compile sans erreur
- [ ] `npm run start:dev` démarre sans erreur
- [ ] Le endpoint `POST /api/v1/auth/register` est accessible (vérifier via Swagger à `http://localhost:3000/api`)
- [ ] Le endpoint `POST /api/v1/auth/login` est accessible
- [ ] Le endpoint `POST /api/v1/auth/refresh` est accessible
- [ ] Le endpoint `POST /api/v1/auth/logout` est accessible

#### Step 6.9 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6.10 : Tests fonctionnels manuels (Swagger / cURL)

Vérifier le flux complet via Swagger UI (`http://localhost:3000/api`) ou cURL :

- [ ] **Register** — `POST /api/v1/auth/register`

```json
{
  "email": "test@mellifera.com",
  "password": "Password123!",
  "nom": "Dupont",
  "prenom": "Jean"
}
```

→ Réponse 201 avec `user` + `tokens.accessToken` + `tokens.refreshToken`

- [ ] **Login** — `POST /api/v1/auth/login`

```json
{
  "email": "test@mellifera.com",
  "password": "Password123!"
}
```

→ Réponse 200 avec `user` + `tokens`

- [ ] **Login échoué** — `POST /api/v1/auth/login` avec mauvais mot de passe
      → Réponse 401

- [ ] **Refresh** — `POST /api/v1/auth/refresh` avec le `refreshToken` obtenu

```json
{
  "refreshToken": "<le_refresh_token>"
}
```

→ Réponse 200 avec nouveau `accessToken` + `refreshToken`

- [ ] **Logout** — `POST /api/v1/auth/logout` avec `Authorization: Bearer <accessToken>`

```json
{
  "refreshToken": "<le_refresh_token>"
}
```

→ Réponse 200 avec `{ "message": "Logout successful" }`

- [ ] **Ancien refresh token rejeté** — Re-tenter `POST /api/v1/auth/refresh` avec l'ancien `refreshToken`
      → Réponse 401

##### Step 6.10 Verification Checklist

- [x] Register retourne 201 avec user + tokens
- [x] Login retourne 200 avec user + tokens
- [x] Login avec mauvais credentials retourne 401
- [x] Refresh retourne 200 avec nouveaux tokens
- [x] Logout retourne 200
- [x] Ancien refresh token est rejeté (401) après rotation ou logout

#### Step 6.10 STOP & COMMIT

**STOP & COMMIT:** `feat: add JWT auth with refresh tokens & security`

---

## Récapitulatif des fichiers créés

| Fichier                                                      | Description                                             |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| `src/interfaces/common/decorators/current-user.decorator.ts` | Decorator `@CurrentUser()` + interface `JwtPayload`     |
| `src/interfaces/common/decorators/index.ts`                  | Barrel export decorators                                |
| `src/interfaces/common/guards/ownership.guard.ts`            | Guard de vérification ownership par resource type       |
| `src/interfaces/common/guards/index.ts`                      | Barrel export guards                                    |
| `src/interfaces/common/index.ts`                             | Barrel export common                                    |
| `src/infrastructure/auth/jwt.strategy.ts`                    | Passport strategy pour access tokens                    |
| `src/infrastructure/auth/jwt-refresh.strategy.ts`            | Passport strategy pour refresh tokens                   |
| `src/infrastructure/auth/jwt-auth.guard.ts`                  | Guard access token                                      |
| `src/infrastructure/auth/jwt-refresh-auth.guard.ts`          | Guard refresh token                                     |
| `src/infrastructure/auth/auth.service.ts`                    | Service auth complet (register, login, refresh, logout) |
| `src/infrastructure/auth/auth.module.ts`                     | Module NestJS auth                                      |
| `src/infrastructure/auth/index.ts`                           | Barrel export auth                                      |
| `src/interfaces/auth/dto/register.dto.ts`                    | DTO d'inscription                                       |
| `src/interfaces/auth/dto/login.dto.ts`                       | DTO de connexion                                        |
| `src/interfaces/auth/dto/refresh-token.dto.ts`               | DTO refresh token                                       |
| `src/interfaces/auth/dto/index.ts`                           | Barrel export DTOs                                      |
| `src/interfaces/auth/auth.controller.ts`                     | Contrôleur REST auth (4 endpoints)                      |
| `src/interfaces/auth/index.ts`                               | Barrel export auth interface                            |
| `src/app.module.ts`                                          | Mis à jour avec AuthModule + AuthController             |
