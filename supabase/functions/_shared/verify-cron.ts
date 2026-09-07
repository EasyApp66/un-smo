import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Prüft den Authorization-Header eines geplanten Aufrufs gegen CRON_SECRET.
 * Gibt eine Fehlerantwort zurück, wenn der Aufruf nicht autorisiert ist – sonst null.
 */
export function authenticateCronRequest(request: Request): Response | null {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret) return new Response('Server configuration error', { status: 500 });

  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get('authorization') ?? '');
  const token = match?.[1];
  if (!token) return new Response('Unauthorized', { status: 401 });

  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  if (!timingSafeEqual(digest(token), digest(secret))) {
    return new Response('Unauthorized', { status: 401 });
  }

  return null;
}
