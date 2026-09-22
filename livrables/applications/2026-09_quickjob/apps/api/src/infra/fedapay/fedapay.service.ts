import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@quickjob/config';
import { currencyMinorUnitDecimals } from '../../common/utils/currency-decimals.util';

const SANDBOX_BASE_URL = 'https://sandbox-api.fedapay.com';
const LIVE_BASE_URL = 'https://api.fedapay.com';

export interface FedapayTransaction {
  id: string;
  status: string;
  amount: number;
  reference: string | null;
}

export interface CreateTransactionInput {
  /** Montant en unités mineures (centimes) — pattern Money du projet. */
  amountMinorUnits: bigint;
  currency: string;
  description: string;
  callbackUrl: string;
  customerEmail?: string;
}

/**
 * Client HTTP minimal pour l'API FedaPay (Mobile Money) — pas de SDK tiers :
 * juste des requêtes vers leur API REST documentée, dans le même esprit que
 * MailService pour Brevo (host/identifiants, pas de dépendance propriétaire
 * non typée). Les erreurs FedaPay (texte brut renvoyé par leur API) sont
 * toujours propagées telles quelles — utile pour diagnostiquer un souci
 * d'intégration sans deviner.
 */
@Injectable()
export class FedapayService {
  private readonly logger = new Logger(FedapayService.name);
  private readonly baseUrl: string;
  private readonly secretKey?: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const environment = this.configService.get('FEDAPAY_ENVIRONMENT', { infer: true });
    this.baseUrl = environment === 'live' ? LIVE_BASE_URL : SANDBOX_BASE_URL;
    this.secretKey = this.configService.get('FEDAPAY_SECRET_KEY', { infer: true });
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  /**
   * Crée une transaction FedaPay puis génère son lien de paiement (token).
   * Renvoie l'URL vers laquelle rediriger le client — la saisie du numéro/
   * code Mobile Money se fait entièrement sur la page sécurisée de FedaPay,
   * jamais sur QuickJob.
   */
  async createTransactionWithCheckoutUrl(
    input: CreateTransactionInput,
  ): Promise<{ transactionId: string; checkoutUrl: string }> {
    const decimals = currencyMinorUnitDecimals(input.currency);
    const majorAmount = Number(input.amountMinorUnits) / 10 ** decimals;

    const transaction = await this.request<Record<string, unknown>>('/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: input.description,
        amount: majorAmount,
        currency: { iso: input.currency },
        callback_url: input.callbackUrl,
        ...(input.customerEmail ? { customer: { email: input.customerEmail } } : {}),
      }),
    });

    const transactionId = this.extractId(transaction);
    if (!transactionId) {
      throw new Error(`FedaPay: impossible de lire l'identifiant de la transaction créée: ${JSON.stringify(transaction)}`);
    }

    const tokenResponse = await this.request<Record<string, unknown>>(
      `/v1/transactions/${transactionId}/token`,
      { method: 'POST' },
    );
    const checkoutUrl =
      (tokenResponse.url as string | undefined) ??
      ((tokenResponse.token as Record<string, unknown> | undefined)?.url as string | undefined);
    if (!checkoutUrl) {
      throw new Error(`FedaPay: impossible de lire l'URL de paiement: ${JSON.stringify(tokenResponse)}`);
    }

    return { transactionId, checkoutUrl };
  }

  /**
   * Relit le VRAI statut d'une transaction directement depuis l'API FedaPay
   * (avec notre propre clé secrète) — jamais à partir du seul contenu d'un
   * webhook reçu, qui pourrait être falsifié.
   */
  async retrieveTransaction(transactionId: string): Promise<FedapayTransaction> {
    const raw = await this.request<Record<string, unknown>>(`/v1/transactions/${transactionId}`, {
      method: 'GET',
    });
    const source = (raw['v1/transaction'] as Record<string, unknown> | undefined) ?? raw;
    return {
      id: String(source.id ?? transactionId),
      status: String(source.status ?? 'unknown'),
      amount: Number(source.amount ?? 0),
      reference: (source.reference as string | undefined) ?? null,
    };
  }

  private extractId(payload: Record<string, unknown>): string | null {
    const source = (payload['v1/transaction'] as Record<string, unknown> | undefined) ?? payload;
    const id = source.id;
    return id !== undefined && id !== null ? String(id) : null;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    if (!this.secretKey) {
      throw new Error('FedaPay is not configured (FEDAPAY_SECRET_KEY missing)');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    const bodyText = await response.text();
    if (!response.ok) {
      this.logger.error(`FedaPay ${init.method ?? 'GET'} ${path} -> ${response.status}: ${bodyText}`);
      throw new Error(`FedaPay a répondu ${response.status} sur ${path}: ${bodyText}`);
    }

    return bodyText ? (JSON.parse(bodyText) as T) : ({} as T);
  }
}
