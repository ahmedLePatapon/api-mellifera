import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  create(refreshToken: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  findByToken(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revokeByToken(tokenHash: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
