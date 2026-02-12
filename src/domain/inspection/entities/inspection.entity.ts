import { EtatGeneral, NiveauReserve, Comportement } from '../../enums';

export interface InspectionProps {
  id: string;
  date: Date;
  etatGeneral: EtatGeneral;
  niveauReserve: NiveauReserve | null;
  comportement: Comportement | null;
  presenceReine: boolean | null;
  nombreCadres: number | null;
  presenceMaladie: boolean | null;
  descriptionMaladie: string | null;
  traitementApplique: string | null;
  recolteKg: number | null;
  notes: string | null;
  rucheId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectionProps {
  date: Date;
  etatGeneral: EtatGeneral;
  niveauReserve?: NiveauReserve | null;
  comportement?: Comportement | null;
  presenceReine?: boolean | null;
  nombreCadres?: number | null;
  presenceMaladie?: boolean | null;
  descriptionMaladie?: string | null;
  traitementApplique?: string | null;
  recolteKg?: number | null;
  notes?: string | null;
  rucheId: string;
}

export class InspectionEntity {
  readonly id: string;
  readonly date: Date;
  readonly etatGeneral: EtatGeneral;
  readonly niveauReserve: NiveauReserve | null;
  readonly comportement: Comportement | null;
  readonly presenceReine: boolean | null;
  readonly nombreCadres: number | null;
  readonly presenceMaladie: boolean | null;
  readonly descriptionMaladie: string | null;
  readonly traitementApplique: string | null;
  readonly recolteKg: number | null;
  readonly notes: string | null;
  readonly rucheId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: InspectionProps) {
    this.id = props.id;
    this.date = props.date;
    this.etatGeneral = props.etatGeneral;
    this.niveauReserve = props.niveauReserve;
    this.comportement = props.comportement;
    this.presenceReine = props.presenceReine;
    this.nombreCadres = props.nombreCadres;
    this.presenceMaladie = props.presenceMaladie;
    this.descriptionMaladie = props.descriptionMaladie;
    this.traitementApplique = props.traitementApplique;
    this.recolteKg = props.recolteKg;
    this.notes = props.notes;
    this.rucheId = props.rucheId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateInspectionProps): InspectionEntity {
    if (!props.date) {
      throw new Error('Inspection date is required');
    }

    if (!props.etatGeneral) {
      throw new Error('Inspection etatGeneral is required');
    }

    if (props.nombreCadres !== undefined && props.nombreCadres !== null && props.nombreCadres < 0) {
      throw new Error('Inspection nombreCadres cannot be negative');
    }

    if (props.recolteKg !== undefined && props.recolteKg !== null && props.recolteKg < 0) {
      throw new Error('Inspection recolteKg cannot be negative');
    }

    return new InspectionEntity({
      id: '',
      date: props.date,
      etatGeneral: props.etatGeneral,
      niveauReserve: props.niveauReserve ?? null,
      comportement: props.comportement ?? null,
      presenceReine: props.presenceReine ?? null,
      nombreCadres: props.nombreCadres ?? null,
      presenceMaladie: props.presenceMaladie ?? false,
      descriptionMaladie: props.descriptionMaladie?.trim() ?? null,
      traitementApplique: props.traitementApplique?.trim() ?? null,
      recolteKg: props.recolteKg ?? null,
      notes: props.notes?.trim() ?? null,
      rucheId: props.rucheId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: InspectionProps): InspectionEntity {
    return new InspectionEntity(props);
  }
}
