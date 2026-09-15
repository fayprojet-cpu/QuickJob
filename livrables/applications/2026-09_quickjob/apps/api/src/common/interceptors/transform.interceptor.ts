import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Enveloppe toutes les réponses réussies dans `{ data }` et rend les valeurs
 * sérialisables en JSON — en particulier les `BigInt` du pattern Money, que
 * `JSON.stringify` ne sait pas encoder nativement (converti en string).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: unknown }> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<{ data: unknown }> {
    return next.handle().pipe(map((data) => ({ data: makeJsonSafe(data) })));
  }
}

export function makeJsonSafe<T>(value: T): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => makeJsonSafe(item));
  }
  if (value instanceof Date) {
    return value;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        makeJsonSafe(val),
      ]),
    );
  }
  return value;
}
