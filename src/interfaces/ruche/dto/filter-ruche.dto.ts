import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { TypeRuche, StatutRuche } from '@domain/enums';

export class FilterRucheDto {
    /** Filtrer par statut de ruche */
    @ApiPropertyOptional({ enum: StatutRuche, example: StatutRuche.ACTIVE })
    @IsOptional()
    @IsEnum(StatutRuche, { message: 'Le statut doit être une valeur valide' })
    statut?: StatutRuche;

    /** Filtrer par type de ruche */
    @ApiPropertyOptional({ enum: TypeRuche, example: TypeRuche.DADANT })
    @IsOptional()
    @IsEnum(TypeRuche, { message: 'Le type doit être une valeur valide' })
    type?: TypeRuche;
}
