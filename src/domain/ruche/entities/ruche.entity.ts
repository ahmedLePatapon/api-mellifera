import { TypeRuche, StatutRuche } from '../../enums';

export interface RucheProps {
  id: string;
  nom: string;
  type: TypeRuche;
  statut: StatutRuche;
  dateAchat: Date | null;
  notes: string | null;
  rucherId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRucheProps {
  nom: string;
  type?: TypeRuche;
  statut?: StatutRuche;
  dateAchat?: Date | null;
  notes?: string | null;
  rucherId: string;
}

export class RucheEntity {
  readonly id: string;
  readonly nom: string;
  readonly type: TypeRuche;
  readonly statut: StatutRuche;
  readonly dateAchat: Date | null;
  readonly notes: string | null;
  readonly rucherId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: RucheProps) {
    this.id = props.id;
    this.nom = props.nom;
    this.type = props.type;
    this.statut = props.statut;
    this.dateAchat = props.dateAchat;
    this.notes = props.notes;
    this.rucherId = props.rucherId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateRucheProps): RucheEntity {
    if (!props.nom || props.nom.trim().length === 0) {
      throw new Error('Ruche nom cannot be empty');
    }

    return new RucheEntity({
      id: '',
      nom: props.nom.trim(),
      type: props.type ?? TypeRuche.DADANT,
      statut: props.statut ?? StatutRuche.ACTIVE,
      dateAchat: props.dateAchat ?? null,
      notes: props.notes?.trim() ?? null,
      rucherId: props.rucherId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: RucheProps): RucheEntity {
    return new RucheEntity(props);
  }
}
