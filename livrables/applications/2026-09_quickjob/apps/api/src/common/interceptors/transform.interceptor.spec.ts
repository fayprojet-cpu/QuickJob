import { Prisma } from '@prisma/client';
import { makeJsonSafe } from './transform.interceptor';

describe('makeJsonSafe', () => {
  it('convertit un Decimal en string plutôt que de le détruire par récursion générique', () => {
    const result = makeJsonSafe({ latitude: new Prisma.Decimal('48.856600'), longitude: null });
    expect(result).toEqual({ latitude: '48.8566', longitude: null });
  });

  it('convertit un BigInt en string', () => {
    expect(makeJsonSafe(100n)).toBe('100');
  });

  it('laisse passer les valeurs simples et les tableaux inchangés', () => {
    expect(makeJsonSafe('Paris')).toBe('Paris');
    expect(makeJsonSafe([new Prisma.Decimal('1.5'), null])).toEqual(['1.5', null]);
  });
});
