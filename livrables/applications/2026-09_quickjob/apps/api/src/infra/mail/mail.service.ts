import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@quickjob/config';
import * as nodemailer from 'nodemailer';
import { buildApplicationDecisionEmail } from './application-decision-email.template';
import { buildNewApplicationEmail } from './new-application-email.template';
import { buildPasswordResetEmail } from './password-reset-email.template';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function parseFromAddress(raw: string): { name?: string; email: string } {
  const match = raw.match(/^(.*)<(.+)>$/);
  if (!match) {
    return { email: raw.trim() };
  }
  const name = match[1].trim().replace(/^"|"$/g, '');
  return { name: name || undefined, email: match[2].trim() };
}

/**
 * Envoi d'email. Deux modes selon ce qui est configuré :
 *  - BREVO_API_KEY présent : envoi via l'API HTTP de Brevo (port 443).
 *    Nécessaire sur les hébergeurs (ex. Render) qui bloquent les connexions
 *    SMTP sortantes — un envoi SMTP y reste bloqué ~2 min avant d'échouer
 *    silencieusement, alors que l'API HTTP n'est jamais filtrée.
 *  - Sinon, SMTP_HOST/SMTP_USER/SMTP_PASSWORD présents : SMTP générique
 *    (Gmail, Brevo SMTP, tout fournisseur), pour le dev local par exemple.
 *  - Sinon : mode "console" (le lien est loggé, pas d'envoi réel).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private brevoApiKey: string | null = null;

  constructor(private readonly configService: ConfigService<Env, true>) {}

  onModuleInit(): void {
    const brevoApiKey = this.configService.get('BREVO_API_KEY', { infer: true });
    if (brevoApiKey) {
      this.brevoApiKey = brevoApiKey;
      this.logger.log('MailService: envoi via l\'API HTTP Brevo activé');
      return;
    }

    const host = this.configService.get('SMTP_HOST', { infer: true });
    const user = this.configService.get('SMTP_USER', { infer: true });
    const password = this.configService.get('SMTP_PASSWORD', { infer: true });

    if (host && user && password) {
      const port = this.configService.get('SMTP_PORT', { infer: true }) ?? 587;
      const secure = this.configService.get('SMTP_SECURE', { infer: true }) === 'true';
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass: password },
      });
      this.logger.log(`MailService: envoi SMTP réel activé (${host}:${port})`);
    } else {
      this.logger.warn(
        'MailService: SMTP non configuré — les emails seront uniquement loggés (mode dev).',
      );
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, locale: string): Promise<void> {
    const { subject, html, text } = buildPasswordResetEmail(resetUrl, locale);
    await this.send(to, subject, html, text, resetUrl);
  }

  /** Prévient le recruteur qu'il a reçu une nouvelle candidature sur une de ses missions. */
  async sendNewApplicationEmail(
    to: string,
    recruiterLocale: string,
    jobTitle: string,
    url: string,
  ): Promise<void> {
    const { subject, html, text } = buildNewApplicationEmail(jobTitle, url, recruiterLocale);
    await this.send(to, subject, html, text, url);
  }

  /** Prévient le travailleur que sa candidature a été acceptée ou refusée. */
  async sendApplicationDecisionEmail(
    to: string,
    workerLocale: string,
    jobTitle: string,
    accepted: boolean,
    url: string,
  ): Promise<void> {
    const { subject, html, text } = buildApplicationDecisionEmail(jobTitle, accepted, url, workerLocale);
    await this.send(to, subject, html, text, url);
  }

  /**
   * Mécanisme d'envoi partagé par tous les emails transactionnels (mot de
   * passe oublié, candidature, décision) : API HTTP Brevo si configurée,
   * sinon SMTP générique, sinon fallback "console" (le lien est loggé). Ne
   * lève jamais — un échec d'envoi ne doit jamais casser le flux appelant.
   */
  private async send(to: string, subject: string, html: string, text: string, link: string): Promise<void> {
    const from = this.configService.get('MAIL_FROM', { infer: true }) ?? 'QuickJob <no-reply@quickjob.local>';

    if (this.brevoApiKey) {
      await this.sendViaBrevoApi(to, subject, html, text, from);
      return;
    }

    if (!this.transporter) {
      this.logger.warn(`[dev] Email "${subject}" pour ${to} non envoyé (aucun fournisseur configuré). Lien : ${link}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html, text });
    } catch (error) {
      // On ne casse jamais le flux appelant : un échec d'envoi est loggé, pas propagé.
      this.logger.error(`Échec d'envoi de l'email "${subject}" à ${to}`, error);
    }
  }

  private async sendViaBrevoApi(
    to: string,
    subject: string,
    html: string,
    text: string,
    from: string,
  ): Promise<void> {
    try {
      const sender = parseFromAddress(from);
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': this.brevoApiKey as string,
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Brevo API a répondu ${response.status}: ${body}`);
      }
    } catch (error) {
      this.logger.error(`Échec d'envoi (API Brevo) de l'email de réinitialisation à ${to}`, error);
    }
  }
}
