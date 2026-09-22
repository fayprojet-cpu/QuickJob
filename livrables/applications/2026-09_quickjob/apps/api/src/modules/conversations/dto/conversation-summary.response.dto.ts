import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ConversationParticipantSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
  @ApiPropertyOptional({ nullable: true }) displayName!: string | null;
}

class ConversationLastMessageDto {
  @ApiPropertyOptional({ nullable: true }) body!: string | null;
  @ApiProperty({ format: 'uuid' }) senderId!: string;
  @ApiProperty() createdAt!: Date;
}

export class ConversationSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) jobId!: string | null;
  @ApiPropertyOptional({ nullable: true }) jobTitle!: string | null;
  @ApiPropertyOptional({ nullable: true, type: ConversationParticipantSummaryDto })
  otherParticipant!: ConversationParticipantSummaryDto | null;
  @ApiPropertyOptional({ nullable: true, type: ConversationLastMessageDto })
  lastMessage!: ConversationLastMessageDto | null;
  @ApiProperty() unreadCount!: number;
}
