/**
 * REFERENCE.COM — Limitation de débit en mémoire (fenêtre fixe par clé).
 *
 * Volontairement sans dépendance : adapté à un déploiement mono-processus.
 * Pour du multi-instances, remplacer le Map par un store partagé (Redis,
 * Upstash…) en conservant la même signature `rateLimit(key, limit, windowMs)`.
 */
import { NextResponse } from "next/server"

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Garde-fou mémoire : au-delà, les seaux expirés sont purgés. */
const MAX_BUCKETS = 50_000

function pruneExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/**
 * IP cliente : derrière Caddy/NGINX, `x-forwarded-for` (première adresse)
 * puis `x-real-ip` ; en direct (dev), valeur par défaut partagée.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0].trim()
    if (first) return first
  }
  return request.headers.get("x-real-ip") ?? "local"
}

/**
 * Consomme un jeton du seau `key` :
 * - ok:true → requête autorisée ;
 * - ok:false → quota dépassé, `retryAfterS` conseillé au client.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterS: number } {
  const now = Date.now()
  pruneExpired(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterS: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterS: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }
  return { ok: true, retryAfterS: 0 }
}

/** Réponse 429 standard : message français + en-tête Retry-After. */
export function tooManyRequests(retryAfterS: number): NextResponse {
  return NextResponse.json(
    { error: `Trop de requêtes — réessayez dans ${retryAfterS} s` },
    { status: 429, headers: { "Retry-After": String(retryAfterS) } }
  )
}
