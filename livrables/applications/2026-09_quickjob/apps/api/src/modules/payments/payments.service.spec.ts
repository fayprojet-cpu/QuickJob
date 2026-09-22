import { BadGatewayException, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus, EscrowStatus, PaymentStatus } from '@prisma/client';
import { Env } from '@quickjob/config';
import { FedapayService } from '../../infra/fedapay/fedapay.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PaymentsService } from './payments.service';

const CONFIG_VALUES: Record<string, string> = {
  WEB_URL: 'http://localhost:3000',
};

function buildPrismaMock() {
  return {
    application: {
      findFirst: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    escrow: {
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;
}

function buildFedapayMock() {
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    createTransactionWithCheckoutUrl: jest.fn(),
    retrieveTransaction: jest.fn(),
  } as unknown as FedapayService;
}

function buildConfigServiceMock() {
  return { get: (key: string) => CONFIG_VALUES[key] } as unknown as ConfigService<Env, true>;
}

const baseJob = {
  id: 'job-1',
  title: 'Livraison de colis',
  recruiterId: 'recruiter-1',
  salaryAmount: 15000n,
  salaryCurrency: 'XOF',
};

const baseApplication = {
  id: 'app-1',
  jobId: 'job-1',
  workerId: 'worker-1',
  status: ApplicationStatus.ACCEPTED,
  job: baseJob,
  worker: { email: 'worker@example.com' },
  escrow: null,
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let fedapay: ReturnType<typeof buildFedapayMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    fedapay = buildFedapayMock();
    service = new PaymentsService(prisma, fedapay, buildConfigServiceMock());
  });

  describe('fundApplication', () => {
    it('throws ServiceUnavailableException when FedaPay is not configured', async () => {
      (fedapay.isConfigured as jest.Mock).mockReturnValue(false);

      await expect(service.fundApplication('app-1', 'recruiter-1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('throws NotFoundException when the application does not belong to the recruiter', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.fundApplication('app-1', 'someone-else')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the application is not ACCEPTED', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        status: ApplicationStatus.PENDING,
      });

      await expect(service.fundApplication('app-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the job has no agreed salary ("à négocier")', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        job: { ...baseJob, salaryAmount: null, salaryCurrency: null },
      });

      await expect(service.fundApplication('app-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the escrow is already HELD', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        escrow: { id: 'escrow-1', status: EscrowStatus.HELD },
      });

      await expect(service.fundApplication('app-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates a payment + escrow and returns the FedaPay checkout URL', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.payment.create as jest.Mock).mockResolvedValue({ id: 'payment-1' });
      (fedapay.createTransactionWithCheckoutUrl as jest.Mock).mockResolvedValue({
        transactionId: 'txn-1',
        checkoutUrl: 'https://sandbox-api.fedapay.com/checkout/txn-1',
      });

      const result = await service.fundApplication('app-1', 'recruiter-1');

      expect(result).toEqual({ checkoutUrl: 'https://sandbox-api.fedapay.com/checkout/txn-1' });
      expect(prisma.escrow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 'app-1',
            recruiterId: 'recruiter-1',
            workerId: 'worker-1',
            amount: 15000n,
            currency: 'XOF',
            paymentId: 'payment-1',
          }),
        }),
      );
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: { providerRef: 'txn-1' },
        }),
      );
    });

    it('reuses the existing escrow row instead of creating a new one', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        escrow: { id: 'escrow-1', status: EscrowStatus.PENDING },
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({ id: 'payment-2' });
      (fedapay.createTransactionWithCheckoutUrl as jest.Mock).mockResolvedValue({
        transactionId: 'txn-2',
        checkoutUrl: 'https://sandbox-api.fedapay.com/checkout/txn-2',
      });

      await service.fundApplication('app-1', 'recruiter-1');

      expect(prisma.escrow.create).not.toHaveBeenCalled();
      expect(prisma.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'escrow-1' }, data: { paymentId: 'payment-2', status: EscrowStatus.PENDING } }),
      );
    });

    it('marks the payment FAILED and rethrows when FedaPay rejects the transaction', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.payment.create as jest.Mock).mockResolvedValue({ id: 'payment-3' });
      (fedapay.createTransactionWithCheckoutUrl as jest.Mock).mockRejectedValue(new Error('FedaPay 400'));

      await expect(service.fundApplication('app-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-3' }, data: { status: PaymentStatus.FAILED } }),
      );
    });
  });

  describe('handleFedapayWebhook', () => {
    it('does nothing when no transaction id can be extracted from the payload', async () => {
      await service.handleFedapayWebhook({ foo: 'bar' });

      expect(prisma.payment.findFirst).not.toHaveBeenCalled();
    });

    it('does nothing when no matching payment is found for the transaction', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);

      await service.handleFedapayWebhook({ id: 'txn-1' });

      expect(fedapay.retrieveTransaction).not.toHaveBeenCalled();
    });

    it('captures the payment and holds the escrow when FedaPay confirms the transaction is approved', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
        escrow: { id: 'escrow-1' },
      });
      (fedapay.retrieveTransaction as jest.Mock).mockResolvedValue({
        id: 'txn-1',
        status: 'approved',
        amount: 15000,
        reference: 'ref-1',
      });

      await service.handleFedapayWebhook({ entity: { id: 'txn-1' } });

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' }, data: { status: PaymentStatus.CAPTURED } }),
      );
      expect(prisma.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'escrow-1' },
          data: expect.objectContaining({ status: EscrowStatus.HELD }),
        }),
      );
    });

    it('marks the payment FAILED when FedaPay confirms the transaction was declined', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
        escrow: { id: 'escrow-1' },
      });
      (fedapay.retrieveTransaction as jest.Mock).mockResolvedValue({
        id: 'txn-1',
        status: 'declined',
        amount: 15000,
        reference: null,
      });

      await service.handleFedapayWebhook({ id: 'txn-1' });

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' }, data: { status: PaymentStatus.FAILED } }),
      );
      expect(prisma.escrow.update).not.toHaveBeenCalled();
    });

    it('does not re-update an already CAPTURED payment (idempotent)', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.CAPTURED,
        escrow: { id: 'escrow-1' },
      });
      (fedapay.retrieveTransaction as jest.Mock).mockResolvedValue({
        id: 'txn-1',
        status: 'approved',
        amount: 15000,
        reference: null,
      });

      await service.handleFedapayWebhook({ id: 'txn-1' });

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.escrow.update).not.toHaveBeenCalled();
    });
  });
});
