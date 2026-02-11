import { Role } from '@domain/enums';

export class RegisterUserCommand {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly nom: string,
        public readonly prenom: string,
        public readonly role?: Role,
    ) { }
}
