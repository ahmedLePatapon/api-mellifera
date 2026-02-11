import { TypeRuche, StatutRuche } from '@domain/enums';

export class CreateRucheCommand {
    constructor(
        public readonly nom: string,
        public readonly rucherId: string,
        public readonly userId: string,
        public readonly type?: TypeRuche,
        public readonly statut?: StatutRuche,
        public readonly dateAchat?: Date | null,
        public readonly notes?: string | null,
    ) { }
}
