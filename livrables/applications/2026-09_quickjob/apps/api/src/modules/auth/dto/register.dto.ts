import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const SELF_SERVICE_ROLES = [UserRole.WORKER, UserRole.RECRUITER] as const;

export class RegisterDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3cur3-Passphrase', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  password!: string;

  @ApiPropertyOptional({
    enum: SELF_SERVICE_ROLES,
    isArray: true,
    default: [UserRole.WORKER],
    description: 'Rôle(s) demandés à l\'inscription. ADMIN/SUPER_ADMIN ne sont jamais auto-attribuables.',
  })
  @IsOptional()
  @IsArray()
  @IsIn(SELF_SERVICE_ROLES, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ example: 'fr', description: 'Locale BCP 47' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'FR', description: 'Code pays ISO 3166-1 alpha-2' })
  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?: string;
}
