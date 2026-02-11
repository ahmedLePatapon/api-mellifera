export class CreateRucherCommand {
    constructor(
        public readonly nom: string,
        public readonly userId: string,
        public readonly adresse?: string | null,
        public readonly latitude?: number | null,
        public readonly longitude?: number | null,
        public readonly description?: string | null,
    ) { }
}
