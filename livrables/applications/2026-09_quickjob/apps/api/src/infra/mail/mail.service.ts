import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@quickjob/config';
import * as nodemailer from 'nodemailer';
import { buildPasswordResetEmail } from './password-reset-email.template';

/**
 * Envoi d'email par SMTP générique (Gmail, Brevo, tout fournisseur SMTP —
 * jamais de SDK propriétaire, juste host/port/identifiants). Si SMTP_HOST/
 * SMTP_USER/SMTP_PASSWORD sont absents (dev sans fournisseur configuré), on
 * bascule automatiquement sur un envoi "console" : le lien est loggé au lieu
 * d'être réellement envoyé, pour que le flux reste testable sans SMTP.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService<Env, true>) {}

  onModuleInit(): void {
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

    if (!this.transporter) {
      this.logger.warn(`[dev] Lien de réinitialisation pour ${to} : ${resetUrl}`);
      return;
    }

    const from = this.configService.get('MAIL_FROM', { infer: true }) ?? 'QuickJob <no-reply@quickjob.local>';

    try {
      await this.transporter.sendMail({ from, to, subject, html, text });
    } catch (error) {
      // On ne casse jamais le flux appelant (forgot-password reste 200) :
      // un échec d'envoi est loggé, pas propagé.
      this.logger.error(`Échec d'envoi de l'email de réinitialisation à ${to}`, error);
    }
  }
}
