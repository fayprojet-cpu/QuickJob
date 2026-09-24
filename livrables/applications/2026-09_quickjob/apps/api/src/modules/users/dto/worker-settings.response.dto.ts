import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillResponseDto } from '../../skills/dto/skill.response.dto';

/**
 * Réservé au compte connecté (GET/PATCH /users/me/worker-settings) — expose
 * latitude/longitude en clair, contrairement au profil public
 * (UserProfileResponseDto) qui ne doit jamais les exposer.
 */
export class WorkerSettingsResponseDto {
  @ApiProperty({ type: [SkillResponseDto] }) skills!: SkillResponseDto[];
  @ApiProperty() canDoGeneral!: boolean;
  @ApiProperty({ type: [String] }) acceptedCategoryKeys!: string[];
  @ApiProperty() availableNow!: boolean;
  @ApiPropertyOptional({ nullable: true }) city!: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude!: unknown;
  @ApiPropertyOptional({ nullable: true }) longitude!: unknown;
  @ApiPropertyOptional({ nullable: true }) travelRadiusKm!: number | null;
}
