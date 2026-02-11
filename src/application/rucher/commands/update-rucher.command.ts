export class UpdateRucherCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly nom?: string,
        public readonly adresse?: string | null,
        public readonly latitude?: number | null,
        public readonly longitude?: number | null,
        public readonly description?: string | null,
    ) { }
}
