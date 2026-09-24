import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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

export class WorkerSettingsDto {
  @ApiPropertyOptional({ type: [String], format: 'uuid', description: 'IDs du catalogue Skill' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({ description: "Accepte les missions simples, hors métier précis" })
  @IsOptional()
  @IsBoolean()
  canDoGeneral?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Sous-ensemble de JobCategory.key acceptés comme mission simple',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  acceptedCategoryKeys?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  availableNow?: boolean;

  @ApiPropertyOptional({ description: 'Ville / quartier — seul champ de localisation exposable publiquement' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  travelRadiusKm?: number;
}
