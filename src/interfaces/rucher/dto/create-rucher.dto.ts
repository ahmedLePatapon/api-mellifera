import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';

export class CreateRucherDto {
  /** Nom du rucher */
  @ApiProperty({ example: 'Rucher des Tilleuls', description: 'Nom du rucher' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du rucher est requis' })
  @MaxLength(200)
  nom!: string;

  /** Adresse du rucher */
  @ApiPropertyOptional({ example: '12 chemin des Abeilles, 31000 Toulouse' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adresse?: string | null;

  /** Latitude GPS */
  @ApiPropertyOptional({ example: 43.6047, description: 'Latitude (-90 à 90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  /** Longitude GPS */
  @ApiPropertyOptional({ example: 1.4442, description: 'Longitude (-180 à 180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  /** Description du rucher */
  @ApiPropertyOptional({ example: 'Rucher principal en bordure de forêt' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}
