import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@quickjob/config';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_AVATAR_MIME_TYPES = Object.keys(EXTENSION_BY_MIME);

/**
 * Client HTTP minimal pour l'API Supabase Storage — pas de SDK tiers, même
 * esprit que MailService (Brevo) et FedapayService : juste des requêtes vers
 * une API REST documentée. On réutilise le projet Supabase déjà en place
 * pour la base de données, pas besoin d'un nouveau fournisseur de stockage.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseUrl?: string;
  private readonly serviceRoleKey?: string;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.baseUrl = this.configService.get('SUPABASE_URL', { infer: true });
    this.serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    this.bucket = this.configService.get('SUPABASE_STORAGE_BUCKET', { infer: true });
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.serviceRoleKey);
  }

  /** Envoie la photo de profil d'un utilisateur et renvoie son URL publique. */
  async uploadAvatar(userId: string, file: Buffer, mimeType: string): Promise<string> {
    if (!this.baseUrl || !this.serviceRoleKey) {
      throw new Error('Storage is not configured (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing)');
    }
    const extension = EXTENSION_BY_MIME[mimeType];
    if (!extension) {
      throw new Error(`Unsupported avatar mime type: ${mimeType}`);
    }

    const path = `avatars/${userId}.${extension}`;
    const response = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: file,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      this.logger.error(`Supabase Storage upload -> ${response.status}: ${bodyText}`);
      throw new Error(`Supabase Storage a répondu ${response.status} lors de l'upload`);
    }

    // Un cache-buster évite que le navigateur garde l'ancienne photo en cache
    // après un remplacement (même chemin, même nom de fichier).
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${path}?t=${Date.now()}`;
  }
}
