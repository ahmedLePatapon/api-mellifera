import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Le refresh token à utiliser pour obtenir un nouveau couple de tokens',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refreshToken!: string;
}
