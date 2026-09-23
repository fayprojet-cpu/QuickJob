import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReviewSummariesQueryDto {
  @ApiProperty({ description: 'Identifiants utilisateur séparés par des virgules', example: 'uuid1,uuid2' })
  @IsString()
  ids!: string;
}
