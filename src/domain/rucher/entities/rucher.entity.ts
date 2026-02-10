import { CoordonneesGps } from '../value-objects/coordonnees-gps.vo';

export interface RucherProps {
    id: string;
    nom: string;
    adresse: string | null;
    coordonnees: CoordonneesGps | null;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRucherProps {
    nom: string;
    adresse?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
    userId: string;
}

export class RucherEntity {
    readonly id: string;
    readonly nom: string;
    readonly adresse: string | null;
    readonly coordonnees: CoordonneesGps | null;
    readonly description: string | null;
    readonly userId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: RucherProps) {
        this.id = props.id;
        this.nom = props.nom;
        this.adresse = props.adresse;
        this.coordonnees = props.coordonnees;
        this.description = props.description;
        this.userId = props.userId;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: CreateRucherProps): RucherEntity {
        if (!props.nom || props.nom.trim().length === 0) {
            throw new Error('Rucher nom cannot be empty');
        }

        let coordonnees: CoordonneesGps | null = null;
        if (
            props.latitude !== undefined &&
            props.latitude !== null &&
            props.longitude !== undefined &&
            props.longitude !== null
        ) {
            coordonnees = CoordonneesGps.create(
                props.latitude,
                props.longitude,
            );
        }

        return new RucherEntity({
            id: '',
            nom: props.nom.trim(),
            adresse: props.adresse?.trim() ?? null,
            coordonnees,
            description: props.description?.trim() ?? null,
            userId: props.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static fromPersistence(props: RucherProps): RucherEntity {
        return new RucherEntity(props);
    }
}
