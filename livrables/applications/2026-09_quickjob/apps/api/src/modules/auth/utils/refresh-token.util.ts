import { createHmac, randomBytes } from 'node:crypto';

/** Génère un secret aléatoire (256 bits) utilisé comme refresh token opaque. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash déterministe (HMAC-SHA256, clé = JWT_REFRESH_SECRET) du refresh token.
 * Déterministe (contrairement à bcrypt) pour permettre une recherche directe
 * en base par `tokenHash` ; le token étant déjà 256 bits d'entropie, une
 * fonction de hash lente comme bcrypt n'apporte rien ici.
 */
export function hashRefreshToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}
