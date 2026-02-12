import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { TypeRuche, StatutRuche } from '@domain/enums';

export class CreateRucheDto {
  /** Nom de la ruche */
  @ApiProperty({ example: 'Ruche Alpha', description: 'Nom de la ruche' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la ruche est requis' })
  @MaxLength(200)
  nom!: string;

  /** Type de ruche */
  @ApiPropertyOptional({ enum: TypeRuche, example: TypeRuche.DADANT })
  @IsOptional()
  @IsEnum(TypeRuche, { message: 'Le type de ruche doit être une valeur valide' })
  type?: TypeRuche;

  /** Statut de la ruche */
  @ApiPropertyOptional({ enum: StatutRuche, example: StatutRuche.ACTIVE })
  @IsOptional()
  @IsEnum(StatutRuche, { message: 'Le statut de la ruche doit être une valeur valide' })
  statut?: StatutRuche;

  /** Date d'achat */
  @ApiPropertyOptional({ example: '2025-03-15', description: "Date d'achat (ISO 8601)" })
  @IsOptional()
  @IsDateString({}, { message: "La date d'achat doit être une date ISO 8601 valide" })
  dateAchat?: string | null;

  /** Notes */
  @ApiPropertyOptional({ example: 'Ruche achetée au printemps' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
