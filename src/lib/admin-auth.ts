/**
 * REFERENCE.COM — Session administrateur du cockpit rédaction.
 *
 * Mécanisme volontairement autonome (aucune dépendance) :
 * - mot de passe unique lu dans ADMIN_PASSWORD (.env) ;
 * - session = cookie httpOnly porteur d'un jeton signé HMAC-SHA256
 *   (charge utile « expiration.nonce », signature vérifiée à temps constant) ;
 * - garde `requireAdmin()` à appeler en tête de chaque handler /api/admin/* ;
 * - contrôle d'origine sur les requêtes mutantes (defense-in-depth CSRF,
 *   en complément du SameSite=Lax du cookie).
 *
 * Limites assumées : administrateur unique, sessions en cookie 12 h,
 * invalidation par rotation de ADMIN_SESSION_SECRET ou changement de mot de passe.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

export const ADMIN_COOKIE = "reference_admin_session"

/** Durée de vie d'une session : 12 heures. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000
export const SESSION_TTL_S = SESSION_TTL_MS / 1000

/* --------------------------------- Secret --------------------------------- */

let ephemeralSecret: string | null = null

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (!ephemeralSecret) {
    ephemeralSecret = randomBytes(32).toString("hex")
    console.warn(
      "[admin-auth] ADMIN_SESSION_SECRET absente ou trop courte (< 32) : " +
        "secret éphémère utilisé, les sessions seront invalidées à chaque redémarrage."
    )
  }
  return ephemeralSecret
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex")
}

/* --------------------------------- Jetons --------------------------------- */

export function createSessionToken(): string {
  const payload = `${Date.now() + SESSION_TTL_MS}.${randomBytes(8).toString("hex")}`
  return `${payload}.${sign(payload)}`
}

/** Vérifie signature + expiration d'un jeton de session. */
export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const payload = `${parts[0]}.${parts[1]}`
  const given = Buffer.from(parts[2], "utf8")
  const expected = Buffer.from(sign(payload), "utf8")
  // Deux hex sha256 : longueurs garanties égales → comparaison à temps constant.
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return false
  }
  const expiresAt = Number.parseInt(parts[0], 10)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

/* ------------------------------- Mot de passe ------------------------------ */

export function isAdminConfigured(): boolean {
  const expected = process.env.ADMIN_PASSWORD
  return typeof expected === "string" && expected.length >= 8
}

/** Comparaison à temps constant via empreintes de longueur égale. */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (typeof expected !== "string" || expected.length < 8 || !candidate) {
    return false
  }
  const a = createHash("sha256").update(candidate, "utf8").digest()
  const b = createHash("sha256").update(expected, "utf8").digest()
  return timingSafeEqual(a, b)
}

/* --------------------------------- Cookies -------------------------------- */

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_S,
  }
}

/** Cookie d'effacement immédiat (déconnexion). */
export function clearedCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  }
}

/* ------------------------------ Garde d'accès ------------------------------ */

/** Lit la valeur d'un cookie depuis l'en-tête brut (compatible Request/NextRequest). */
function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie")
  if (!header) return null
  for (const part of header.split(";")) {
    const trimmed = part.trim()
    if (trimmed.startsWith(`${name}=`)) return trimmed.slice(name.length + 1)
  }
  return null
}

/**
 * Requêtes mutantes : l'Origin (envoyée par les navigateurs sur POST/PATCH/…)
 * doit correspondre au Host courant — bloque le CSRF même si le SameSite
 * était un jour relâché. Absente (curl, tests) → pas de blocage.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const method = request.method.toUpperCase()
  if (method === "GET" || method === "HEAD") return null
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")
  if (!origin || !host) return null
  try {
    if (new URL(origin).host !== host) {
      return NextResponse.json(
        { error: "Requête inter-origine refusée" },
        { status: 403 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: "Requête inter-origine refusée" },
      { status: 403 }
    )
  }
  return null
}

/**
 * Garde d'accès des handlers /api/admin/* — à appeler en premier :
 *
 *   const denied = await requireAdmin(request)
 *   if (denied) return denied
 *
 * Retourne une réponse 401/403 à retourner immédiatement, ou null si autorisé.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const originDenied = assertSameOrigin(request)
  if (originDenied) return originDenied

  const token = readCookie(request, ADMIN_COOKIE)
  if (!verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Session administrateur requise" },
      { status: 401 }
    )
  }
  return null
}
