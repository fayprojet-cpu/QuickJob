import { createHash, randomBytes } from 'node:crypto';

/** Génère un token aléatoire (256 bits) envoyé par email, jamais stocké tel quel. */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash déterministe (SHA-256, non salé) du token de réinitialisation — permet
 * une recherche directe en base par `tokenHash`. Un salage/HMAC n'apporte
 * rien ici : le token est déjà 256 bits d'entropie aléatoire, imprévisible.
 */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
