import { ApiProperty } from '@nestjs/swagger';

export class SkillResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'skill.plumbing' }) key!: string;
  @ApiProperty({ example: 'skill.plumbing.label' }) labelKey!: string;
}
