import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobUrgency, RecurrenceFrequency, SalaryType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsISO31661Alpha2,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const ISO_4217 = /^[A-Z]{3}$/;
/** Entier positif en unités mineures (centimes) — jamais de virgule/float. */
const POSITIVE_INTEGER_STRING = /^[1-9]\d*$/;

export class CreateJobDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({
    type: String,
    example: '15000',
    description:
      'Montant en unités mineures (centimes), entier positif encodé en string. Absent = rémunération à négocier.',
  })
  @IsOptional()
  @Matches(POSITIVE_INTEGER_STRING, { message: 'salaryAmount must be a positive integer string' })
  salaryAmount?: string;

  @ApiPropertyOptional({ example: 'EUR', description: 'Absent = rémunération à négocier.' })
  @IsOptional()
  @Matches(ISO_4217, { message: 'salaryCurrency must be a 3-letter ISO 4217 code' })
  salaryCurrency?: string;

  @ApiPropertyOptional({ enum: SalaryType, default: SalaryType.FIXED })
  @IsOptional()
  @IsEnum(SalaryType)
  salaryType?: SalaryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  durationMinutes?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ enum: JobUrgency, default: JobUrgency.FLEXIBLE })
  @IsOptional()
  @IsEnum(JobUrgency)
  urgency?: JobUrgency;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  workersNeeded?: number;

  @ApiPropertyOptional({ enum: RecurrenceFrequency, default: RecurrenceFrequency.NONE })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  recurrence?: RecurrenceFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Code pays ISO 3166-1 alpha-2' })
  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?: string;
}
