import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'apiculteur@example.com',
        description: "Adresse email de l'utilisateur",
    })
    @IsEmail({}, { message: "L'email doit être une adresse email valide" })
    @IsNotEmpty({ message: "L'email est requis" })
    email!: string;

    @ApiProperty({
        example: 'MonMotDePasse123!',
        description: "Mot de passe de l'utilisateur",
    })
    @IsString()
    @IsNotEmpty({ message: 'Le mot de passe est requis' })
    password!: string;
}
