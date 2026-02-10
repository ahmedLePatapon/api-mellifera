export interface RefreshTokenProps {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
}

export interface CreateRefreshTokenProps {
    token: string;
    userId: string;
    expiresAt: Date;
}

export class RefreshTokenEntity {
    readonly id: string;
    readonly token: string;
    readonly userId: string;
    readonly expiresAt: Date;
    readonly revokedAt: Date | null;
    readonly createdAt: Date;

    private constructor(props: RefreshTokenProps) {
        this.id = props.id;
        this.token = props.token;
        this.userId = props.userId;
        this.expiresAt = props.expiresAt;
        this.revokedAt = props.revokedAt;
        this.createdAt = props.createdAt;
    }

    static create(props: CreateRefreshTokenProps): RefreshTokenEntity {
        if (!props.token || props.token.trim().length === 0) {
            throw new Error('RefreshToken token cannot be empty');
        }

        if (!props.userId || props.userId.trim().length === 0) {
            throw new Error('RefreshToken userId cannot be empty');
        }

        if (props.expiresAt <= new Date()) {
            throw new Error('RefreshToken expiresAt must be in the future');
        }

        return new RefreshTokenEntity({
            id: '',
            token: props.token,
            userId: props.userId,
            expiresAt: props.expiresAt,
            revokedAt: null,
            createdAt: new Date(),
        });
    }

    static fromPersistence(props: RefreshTokenProps): RefreshTokenEntity {
        return new RefreshTokenEntity(props);
    }

    get isExpired(): boolean {
        return this.expiresAt <= new Date();
    }

    get isRevoked(): boolean {
        return this.revokedAt !== null;
    }

    get isValid(): boolean {
        return !this.isExpired && !this.isRevoked;
    }
}
