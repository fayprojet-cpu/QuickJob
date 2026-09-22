import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReviewSummaryResponseDto } from '../../reviews/dto/review.response.dto';

/** Profil public d'un utilisateur — visible par tous, pas seulement ses interlocuteurs. */
export class UserProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true }) firstName!: string | null;
  @ApiPropertyOptional({ nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ enum: UserRole, isArray: true }) roles!: UserRole[];
  @ApiProperty() memberSince!: Date;
  @ApiProperty({ type: ReviewSummaryResponseDto }) reviews!: ReviewSummaryResponseDto;
}
