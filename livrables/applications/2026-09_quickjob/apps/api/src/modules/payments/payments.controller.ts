import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { FundApplicationResponseDto } from './dto/fund-application-response.dto';
import { PaymentsService } from './payments.service';

/** Financement du séquestre d'une candidature (recruteur, Mobile Money via FedaPay). */
@ApiTags('payments')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationFundingController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.RECRUITER)
  @Post(':id/fund')
  @ApiOperation({ summary: 'Ouvre une transaction Mobile Money (FedaPay) pour financer le séquestre d\'une candidature acceptée' })
  @ApiOkResponse({ type: FundApplicationResponseDto })
  fund(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FundApplicationResponseDto> {
    return this.paymentsService.fundApplication(id, user.id);
  }
}

/** Réception des notifications de paiement FedaPay. */
@ApiTags('payments')
@Controller('payments/webhook')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('fedapay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook FedaPay — revérifie toujours le vrai statut via leur API avant de mettre à jour quoi que ce soit' })
  async fedapayWebhook(@Body() payload: unknown): Promise<{ received: true }> {
    await this.paymentsService.handleFedapayWebhook(payload);
    return { received: true };
  }
}
