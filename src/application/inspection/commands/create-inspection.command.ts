import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class CreateInspectionCommand {
  constructor(
    public readonly date: Date,
    public readonly etatGeneral: EtatGeneral,
    public readonly rucheId: string,
    public readonly userId: string,
    public readonly niveauReserve?: NiveauReserve | null,
    public readonly comportement?: Comportement | null,
    public readonly presenceReine?: boolean | null,
    public readonly nombreCadres?: number | null,
    public readonly presenceMaladie?: boolean | null,
    public readonly descriptionMaladie?: string | null,
    public readonly traitementApplique?: string | null,
    public readonly recolteKg?: number | null,
    public readonly notes?: string | null,
  ) {}
}
