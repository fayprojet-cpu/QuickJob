import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO31661Alpha2, IsOptional, IsString, Matches } from 'class-validator';

const E164_PHONE = /^\+[1-9]\d{6,14}$/;
const ISO_4217 = /^[A-Z]{3}$/;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '+2250700000000', description: 'Format E.164' })
  @IsOptional()
  @Matches(E164_PHONE, { message: 'phone must be in E.164 format, e.g. +2250700000000' })
  phone?: string;

  @ApiPropertyOptional({ example: 'fr', description: 'Locale BCP 47' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'EUR', description: 'Code devise ISO 4217' })
  @IsOptional()
  @Matches(ISO_4217, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency?: string;

  @ApiPropertyOptional({ example: 'FR', description: 'Code pays ISO 3166-1 alpha-2' })
  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?: string;

  @ApiPropertyOptional({ example: 'Europe/Paris', description: 'Identifiant de fuseau IANA' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
