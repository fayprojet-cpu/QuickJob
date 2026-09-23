import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ActivityCounterpartDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true }) firstName!: string | null;
}

export class ActivityItemDto {
  @ApiProperty({ format: 'uuid' }) jobId!: string;
  @ApiProperty() jobTitle!: string;
  @ApiPropertyOptional({ nullable: true }) amount!: string | null;
  @ApiPropertyOptional({ nullable: true }) currency!: string | null;
  @ApiProperty() completedAt!: Date;
  @ApiPropertyOptional({ nullable: true, type: ActivityCounterpartDto })
  counterpart!: ActivityCounterpartDto | null;
}

/** Historique complet et privé — visible seulement par la personne elle-même. */
export class ActivityResponseDto {
  @ApiProperty({ type: [ActivityItemDto] }) asWorker!: ActivityItemDto[];
  @ApiProperty({ type: [ActivityItemDto] }) asRecruiter!: ActivityItemDto[];
}
