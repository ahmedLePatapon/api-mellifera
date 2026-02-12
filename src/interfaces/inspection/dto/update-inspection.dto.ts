import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { EtatGeneral, NiveauReserve, Comportement } from '@domain/enums';

export class UpdateInspectionDto {
  /** Date de l'inspection */
  @ApiPropertyOptional({ example: '2025-06-15', description: "Date de l'inspection (ISO 8601)" })
  @IsOptional()
  @IsDateString({}, { message: 'La date doit être une date ISO 8601 valide' })
  date?: string;

  /** État général de la colonie */
  @ApiPropertyOptional({ enum: EtatGeneral, example: EtatGeneral.BON })
  @IsOptional()
  @IsEnum(EtatGeneral, { message: "L'état général doit être une valeur valide" })
  etatGeneral?: EtatGeneral;

  /** Niveau des réserves */
  @ApiPropertyOptional({ enum: NiveauReserve, example: NiveauReserve.SUFFISANT })
  @IsOptional()
  @IsEnum(NiveauReserve, { message: 'Le niveau de réserve doit être une valeur valide' })
  niveauReserve?: NiveauReserve | null;

  /** Comportement des abeilles */
  @ApiPropertyOptional({ enum: Comportement, example: Comportement.CALME })
  @IsOptional()
  @IsEnum(Comportement, { message: 'Le comportement doit être une valeur valide' })
  comportement?: Comportement | null;

  /** Présence de la reine */
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  presenceReine?: boolean | null;

  /** Nombre de cadres de couvain */
  @ApiPropertyOptional({ example: 7, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le nombre de cadres ne peut pas être négatif' })
  nombreCadres?: number | null;

  /** Présence de maladie */
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  presenceMaladie?: boolean | null;

  /** Description de la maladie */
  @ApiPropertyOptional({ example: 'Varroa détecté' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionMaladie?: string | null;

  /** Traitement appliqué */
  @ApiPropertyOptional({ example: "Traitement à l'acide oxalique" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  traitementApplique?: string | null;

  /** Récolte en kg */
  @ApiPropertyOptional({ example: 12.5, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'La récolte ne peut pas être négative' })
  recolteKg?: number | null;

  /** Notes libres */
  @ApiPropertyOptional({ example: 'Colony vigoureuse, bonne activité au trou de vol' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
