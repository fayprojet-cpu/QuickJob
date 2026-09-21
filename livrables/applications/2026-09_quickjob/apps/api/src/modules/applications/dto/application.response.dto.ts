import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class ApplicationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) jobId!: string;
  @ApiProperty({ format: 'uuid' }) workerId!: string;
  @ApiProperty({ enum: ApplicationStatus }) status!: ApplicationStatus;
  @ApiPropertyOptional({ nullable: true }) coverLetter!: string | null;
  @ApiPropertyOptional({ nullable: true }) decisionMessage!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiPropertyOptional({ nullable: true }) decidedAt!: Date | null;

  @ApiPropertyOptional({
    description: 'Présent uniquement sur GET /jobs/:jobId/applications (vue recruteur).',
  })
  worker?: { id: string; email: string | null; phone: string | null };

  @ApiPropertyOptional({
    description: 'Présent sur GET /applications/mine (vue travailleur) : la mission liée.',
  })
  job?: { id: string; title: string; city: string | null; countryCode: string | null };
}
