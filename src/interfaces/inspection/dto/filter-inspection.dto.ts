import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { EtatGeneral } from '@domain/enums';

export class FilterInspectionDto {
    /** Filtrer à partir de cette date */
    @ApiPropertyOptional({ example: '2025-01-01', description: 'Date de début (ISO 8601)' })
    @IsOptional()
    @IsDateString({}, { message: 'dateFrom doit être une date ISO 8601 valide' })
    dateFrom?: string;

    /** Filtrer jusqu'à cette date */
    @ApiPropertyOptional({ example: '2025-12-31', description: 'Date de fin (ISO 8601)' })
    @IsOptional()
    @IsDateString({}, { message: 'dateTo doit être une date ISO 8601 valide' })
    dateTo?: string;

    /** Filtrer par état général */
    @ApiPropertyOptional({ enum: EtatGeneral, example: EtatGeneral.BON })
    @IsOptional()
    @IsEnum(EtatGeneral, { message: "L'état général doit être une valeur valide" })
    etatGeneral?: EtatGeneral;
}
