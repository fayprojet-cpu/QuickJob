import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus, EscrowStatus, PaymentProviderKey, PaymentPurpose, PaymentStatus } from '@prisma/client';
import { Env } from '@quickjob/config';
import { currencyMinorUnitDecimals } from '../../common/utils/currency-decimals.util';
import { FedapayService, FedapayTransaction } from '../../infra/fedapay/fedapay.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Statuts FedaPay observés qui signalent un paiement définitivement réussi/échoué. */
const CAPTURED_STATUSES = new Set(['approved', 'transferred']);
const FAILED_STATUSES = new Set(['declined', 'canceled']);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fedapay: FedapayService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  /**
   * Le recruteur finance le séquestre d'une candidature ACCEPTÉE — crée
   * (ou réutilise) l'Escrow, ouvre une transaction FedaPay, renvoie l'URL
   * de paiement sécurisée vers laquelle rediriger le recruteur.
   */
  async fundApplication(applicationId: string, recruiterId: string): Promise<{ checkoutUrl: string }> {
    if (!this.fedapay.isConfigured()) {
      throw new ServiceUnavailableException('Le paiement Mobile Money n\'est pas encore configuré');
    }

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, job: { recruiterId } },
      include: {
        job: true,
        worker: { select: { email: true } },
        escrow: { include: { payment: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new BadRequestException('Seule une candidature acceptée peut être financée');
    }
    if (!application.job.salaryAmount || !application.job.salaryCurrency) {
      throw new BadRequestException(
        'Cette mission est "à négocier" — mets à jour un montant avant de financer le séquestre',
      );
    }
    if (application.escrow?.status === EscrowStatus.HELD) {
      throw new BadRequestException('Cette mission est déjà financée');
    }

    const amount = application.job.salaryAmount;
    const currency = application.job.salaryCurrency;

    // Un paiement PENDING est déjà attaché à cet escrow (appel précédent à
    // fund()) : on revérifie son vrai statut FedaPay au lieu d'en ouvrir un
    // second en double, sinon le premier reste orphelin si le recruteur le
    // paie quand même — voir revue de sécurité.
    const existingPayment = application.escrow?.payment;
    if (existingPayment?.providerRef && existingPayment.status === PaymentStatus.PENDING) {
      let transaction: FedapayTransaction;
      try {
        transaction = await this.fedapay.retrieveTransaction(existingPayment.providerRef);
      } catch (error) {
        this.logger.error(
          `Impossible de revérifier la transaction FedaPay existante ${existingPayment.providerRef}`,
          error,
        );
        throw new BadGatewayException("FedaPay n'a pas pu vérifier le paiement en cours, réessaie dans un instant");
      }

      if (CAPTURED_STATUSES.has(transaction.status)) {
        await this.capturePayment(existingPayment, application.escrow!.id, transaction);
        throw new BadRequestException('Cette mission est déjà financée');
      }

      if (!FAILED_STATUSES.has(transaction.status)) {
        const checkoutUrl = await this.fedapay.generateCheckoutUrl(existingPayment.providerRef);
        return { checkoutUrl };
      }

      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        payerId: recruiterId,
        provider: PaymentProviderKey.MOBILE_MONEY,
        amount,
        currency,
        purpose: PaymentPurpose.ESCROW_FUNDING,
        status: PaymentStatus.PENDING,
      },
    });

    if (application.escrow) {
      await this.prisma.escrow.update({
        where: { id: application.escrow.id },
        data: { paymentId: payment.id, status: EscrowStatus.PENDING, amount, currency },
      });
    } else {
      await this.prisma.escrow.create({
        data: {
          jobId: application.jobId,
          applicationId: application.id,
          recruiterId,
          workerId: application.workerId,
          paymentId: payment.id,
          amount,
          currency,
          status: EscrowStatus.PENDING,
        },
      });
    }

    const webUrl = this.configService.get('WEB_URL', { infer: true });

    try {
      const { transactionId, checkoutUrl } = await this.fedapay.createTransactionWithCheckoutUrl({
        amountMinorUnits: amount,
        currency,
        description: `QuickJob — ${application.job.title}`,
        callbackUrl: `${webUrl}/jobs/${application.jobId}/applications`,
        customerEmail: application.worker.email ?? undefined,
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { providerRef: transactionId },
      });

      return { checkoutUrl };
    } catch (error) {
      this.logger.error(`Échec de création de transaction FedaPay pour le paiement ${payment.id}`, error);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw new BadGatewayException("FedaPay n'a pas pu créer la transaction de paiement");
    }
  }

  /**
   * Traite une notification webhook FedaPay. Ne fait JAMAIS confiance au
   * contenu du payload pour décider qu'un paiement a réussi — s'en sert
   * uniquement pour retrouver l'identifiant de transaction, puis revérifie
   * le vrai statut auprès de l'API FedaPay avec notre propre clé secrète.
   */
  async handleFedapayWebhook(payload: unknown): Promise<void> {
    const transactionId = this.extractTransactionId(payload);
    if (!transactionId) {
      this.logger.warn(`Webhook FedaPay reçu sans identifiant de transaction exploitable: ${JSON.stringify(payload)}`);
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: transactionId },
      include: { escrow: true },
    });
    if (!payment) {
      this.logger.warn(`Webhook FedaPay: aucun paiement QuickJob pour la transaction ${transactionId}`);
      return;
    }

    let transaction;
    try {
      transaction = await this.fedapay.retrieveTransaction(transactionId);
    } catch (error) {
      this.logger.error(`Impossible de revérifier la transaction FedaPay ${transactionId}`, error);
      return;
    }

    if (CAPTURED_STATUSES.has(transaction.status) && payment.status !== PaymentStatus.CAPTURED) {
      await this.capturePayment(payment, payment.escrow?.id ?? null, transaction);
      return;
    }

    if (FAILED_STATUSES.has(transaction.status) && payment.status !== PaymentStatus.FAILED) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      this.logger.warn(`Paiement ${payment.id} échoué (transaction FedaPay ${transactionId}: ${transaction.status})`);
    }
  }

  /**
   * Marque un paiement CAPTURED et son escrow HELD — mais seulement si le
   * montant/devise réellement capturés par FedaPay correspondent à ce que ce
   * paiement attendait. Sans ça, un paiement créé pour un montant X pourrait
   * être marqué payé sur la foi d'une transaction FedaPay Y sans rapport.
   */
  private async capturePayment(
    payment: { id: string; amount: bigint; currency: string },
    escrowId: string | null,
    transaction: FedapayTransaction,
  ): Promise<void> {
    if (!this.transactionMatchesPayment(transaction, payment)) {
      this.logger.error(
        `Paiement ${payment.id}: le montant/devise FedaPay (${transaction.amount} ${transaction.currency ?? '?'}) ` +
          `ne correspond pas à ce qui était attendu (${payment.amount} ${payment.currency}) — capture refusée, ` +
          'vérification manuelle nécessaire',
      );
      return;
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CAPTURED },
      }),
      ...(escrowId
        ? [
            this.prisma.escrow.update({
              where: { id: escrowId },
              data: { status: EscrowStatus.HELD, fundedAt: new Date() },
            }),
          ]
        : []),
    ]);
    this.logger.log(`Paiement ${payment.id} capturé (transaction FedaPay ${transaction.id})`);
  }

  private transactionMatchesPayment(
    transaction: FedapayTransaction,
    payment: { amount: bigint; currency: string },
  ): boolean {
    if (transaction.currency && transaction.currency.toUpperCase() !== payment.currency.toUpperCase()) {
      return false;
    }
    const decimals = currencyMinorUnitDecimals(payment.currency);
    const expectedMajor = Number(payment.amount) / 10 ** decimals;
    return Math.abs(transaction.amount - expectedMajor) < 0.01;
  }

  private extractTransactionId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    const body = payload as Record<string, unknown>;
    const candidates = [
      (body.entity as Record<string, unknown> | undefined)?.id,
      (body.data as Record<string, unknown> | undefined)?.id,
      (body['v1/transaction'] as Record<string, unknown> | undefined)?.id,
      body.id,
    ];
    const found = candidates.find((value) => value !== undefined && value !== null);
    return found !== undefined ? String(found) : null;
  }
}
