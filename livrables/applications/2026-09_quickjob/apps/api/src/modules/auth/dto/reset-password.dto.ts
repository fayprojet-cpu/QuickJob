import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reçu par email (paramètre `token` du lien)' })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({ example: 'N3w-S3cur3-Passphrase', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  newPassword!: string;
}
