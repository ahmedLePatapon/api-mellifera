import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
    /** Numéro de la page (commence à 1) */
    @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page: number = 1;

    /** Nombre d'éléments par page */
    @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    /** Champ de tri */
    @ApiPropertyOptional({ example: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    /** Ordre de tri */
    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
