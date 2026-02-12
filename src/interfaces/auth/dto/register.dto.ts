import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'apiculteur@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email!: string;

  @ApiProperty({
    example: 'MonMotDePasse123!',
    description: 'Mot de passe (minimum 8 caractères)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne doit pas dépasser 128 caractères' })
  password!: string;

  @ApiProperty({
    example: 'Dupont',
    description: "Nom de famille de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100)
  nom!: string;

  @ApiProperty({
    example: 'Jean',
    description: "Prénom de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MaxLength(100)
  prenom!: string;
}
