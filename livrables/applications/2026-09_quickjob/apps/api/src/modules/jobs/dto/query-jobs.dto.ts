import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobUrgency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO31661Alpha2,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryJobsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Code pays ISO 3166-1 alpha-2' })
  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ enum: JobUrgency })
  @IsOptional()
  @IsEnum(JobUrgency)
  urgency?: JobUrgency;

  @ApiPropertyOptional({ description: 'Recherche plein texte sur le titre' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ description: 'Borne géographique (carte) : latitude minimale' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  minLat?: number;

  @ApiPropertyOptional({ description: 'Borne géographique (carte) : latitude maximale' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  maxLat?: number;

  @ApiPropertyOptional({ description: 'Borne géographique (carte) : longitude minimale' })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  minLng?: number;

  @ApiPropertyOptional({ description: 'Borne géographique (carte) : longitude maximale' })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  maxLng?: number;
}
