import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class MessageResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) conversationId!: string;
  @ApiProperty({ format: 'uuid' }) senderId!: string;
  @ApiProperty({ enum: MessageType }) type!: MessageType;
  @ApiPropertyOptional({ nullable: true }) body!: string | null;
  @ApiProperty() createdAt!: Date;
}
