import { Role } from '../../enums';
import { Email } from '../value-objects/email.vo';

export interface UserProps {
    id: string;
    email: Email;
    password: string;
    nom: string;
    prenom: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserProps {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    role?: Role;
}

export class UserEntity {
    readonly id: string;
    readonly email: Email;
    readonly password: string;
    readonly nom: string;
    readonly prenom: string;
    readonly role: Role;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: UserProps) {
        this.id = props.id;
        this.email = props.email;
        this.password = props.password;
        this.nom = props.nom;
        this.prenom = props.prenom;
        this.role = props.role;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: CreateUserProps): UserEntity {
        if (!props.nom || props.nom.trim().length === 0) {
            throw new Error('User nom cannot be empty');
        }

        if (!props.prenom || props.prenom.trim().length === 0) {
            throw new Error('User prenom cannot be empty');
        }

        if (!props.password || props.password.length < 8) {
            throw new Error(
                'User password must be at least 8 characters long',
            );
        }

        const email = Email.create(props.email);

        return new UserEntity({
            id: '',
            email,
            password: props.password,
            nom: props.nom.trim(),
            prenom: props.prenom.trim(),
            role: props.role ?? Role.APICULTEUR,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static fromPersistence(props: UserProps): UserEntity {
        return new UserEntity(props);
    }
}
