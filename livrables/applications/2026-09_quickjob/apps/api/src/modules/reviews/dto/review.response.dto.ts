import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) rating!: number;
  @ApiPropertyOptional({ nullable: true }) comment!: string | null;
  @ApiPropertyOptional({ nullable: true }) authorFirstName!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class ReviewSummaryResponseDto {
  @ApiPropertyOptional({ nullable: true, description: 'Moyenne 1-5, null si aucun avis' })
  average!: number | null;
  @ApiProperty() count!: number;
  @ApiProperty({ type: [ReviewResponseDto] }) items!: ReviewResponseDto[];
}

export class AuthoredReviewDto {
  @ApiProperty({ format: 'uuid' }) jobId!: string;
  @ApiProperty({ format: 'uuid' }) targetId!: string;
}

export class ReviewSummaryLiteDto {
  @ApiPropertyOptional({ nullable: true, description: 'Moyenne 1-5, null si aucun avis' })
  average!: number | null;
  @ApiProperty() count!: number;
}
