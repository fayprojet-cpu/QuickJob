import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JobStatus,
  JobUrgency,
  RecurrenceFrequency,
  SalaryType,
} from '@prisma/client';

export class JobResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) recruiterId!: string;
  @ApiProperty({ format: 'uuid' }) categoryId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;

  @ApiProperty({ type: String, description: 'Unités mineures (centimes)' })
  salaryAmount!: bigint;

  @ApiProperty() salaryCurrency!: string;
  @ApiProperty({ enum: SalaryType }) salaryType!: SalaryType;
  @ApiPropertyOptional({ nullable: true }) durationMinutes!: number | null;
  @ApiPropertyOptional({ nullable: true }) startAt!: Date | null;
  @ApiProperty({ enum: JobUrgency }) urgency!: JobUrgency;
  @ApiProperty() workersNeeded!: number;
  @ApiProperty({ enum: JobStatus }) status!: JobStatus;
  @ApiProperty({ enum: RecurrenceFrequency }) recurrence!: RecurrenceFrequency;

  @ApiPropertyOptional({ nullable: true }) latitude!: unknown;
  @ApiPropertyOptional({ nullable: true }) longitude!: unknown;
  @ApiPropertyOptional({ nullable: true }) addressText!: string | null;
  @ApiPropertyOptional({ nullable: true }) city!: string | null;
  @ApiPropertyOptional({ nullable: true }) countryCode!: string | null;

  @ApiPropertyOptional({ nullable: true }) publishedAt!: Date | null;
  @ApiPropertyOptional({ nullable: true }) expiresAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedJobsResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  items!: JobResponseDto[];

  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
