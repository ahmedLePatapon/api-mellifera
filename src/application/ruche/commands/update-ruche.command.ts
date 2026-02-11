import { TypeRuche, StatutRuche } from '@domain/enums';

export class UpdateRucheCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly nom?: string,
        public readonly type?: TypeRuche,
        public readonly statut?: StatutRuche,
        public readonly dateAchat?: Date | null,
        public readonly notes?: string | null,
    ) { }
}
