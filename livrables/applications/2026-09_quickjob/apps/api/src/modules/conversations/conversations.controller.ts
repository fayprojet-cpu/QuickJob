import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ConversationsService, PaginatedMessages } from './conversations.service';
import { ConversationSummaryResponseDto } from './dto/conversation-summary.response.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message.response.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';

/** Messagerie recruteur/travailleur, une fois une candidature acceptée. */
@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes conversations (où je suis participant)' })
  @ApiOkResponse({ type: [ConversationSummaryResponseDto] })
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<ConversationSummaryResponseDto[]> {
    return this.conversationsService.findMine(user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Messages d\'une conversation (participant uniquement) — marque comme lu' })
  findMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryMessagesDto,
  ): Promise<PaginatedMessages> {
    return this.conversationsService.findMessages(id, user.id, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoie un message texte (participant uniquement)' })
  @ApiOkResponse({ type: MessageResponseDto })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.conversationsService.sendMessage(id, user.id, dto);
  }
}
