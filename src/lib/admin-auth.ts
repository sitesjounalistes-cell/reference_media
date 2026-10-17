/**
 * Referencemedia.info — Session administrateur du cockpit rédaction.
 *
 * Mécanisme volontairement autonome (aucune dépendance) :
 * - mot de passe : valeur initiale lue dans ADMIN_PASSWORD (.env), puis
 *   remplaçable à tout moment depuis le cockpit (empreinte scrypt salée
 *   conservée dans SiteSetting — la variable d'environnement reste la clé
 *   de secours tant qu'aucun changement n'a été effectué) ;
 * - session = cookie httpOnly porteur d'un jeton signé HMAC-SHA256
 *   (charge utile « expiration.nonce », signature vérifiée à temps constant) ;
 * - garde `requireAdmin()` à appeler en tête de chaque handler /api/admin/* ;
 * - contrôle d'origine sur les requêtes mutantes (defense-in-depth CSRF,
 *   en complément du SameSite=Lax du cookie).
 *
 * Limites assumées : administrateur unique, sessions en cookie 12 h,
 * invalidation par rotation de ADMIN_SESSION_SECRET ou changement de mot de passe.
 */
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { clientIp } from "@/lib/rate-limit"

const IS_PROD = process.env.NODE_ENV === "production"

/**
 * Nom du cookie de session. En production, le préfixe « __Host- » impose au
 * navigateur : Secure + Path=/ + aucun attribut Domain (anti cookie-tossing
 * depuis un sous-domaine). En dev (HTTP local), le nom simple est requis.
 */
export const ADMIN_COOKIE = IS_PROD
  ? "__Host-reference_admin_session"
  : "reference_admin_session"

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

/** Clé SiteSetting portant l'empreinte scrypt du mot de passe cockpit. */
const PASSWORD_SETTING_KEY = "admin.password.hash"

/** Empreinte scrypt du mot de passe actif, si un changement a déjà eu lieu. */
async function getStoredPasswordHash(): Promise<string | null> {
  try {
    const row = await db.siteSetting.findUnique({
      where: { key: PASSWORD_SETTING_KEY },
      select: { value: true },
    })
    return row?.value ?? null
  } catch (error) {
    // Base injoignable : on retombe sur ADMIN_PASSWORD (la connexion doit
    // rester possible même pendant un cold-start ou une panne Neon).
    console.error("[admin-auth] lecture du mot de passe impossible", error)
    return null
  }
}

/** Empreinte scrypt salée, format « scrypt:<sel hex>:<hash hex> ». */
export function scryptEncode(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`
}

/** Vérifie un candidat contre une empreinte « scrypt:<sel>:<hash> ». */
export function scryptMatches(candidate: string, stored: string): boolean {
  const parts = stored.split(":")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  try {
    const salt = Buffer.from(parts[1], "hex")
    const expected = Buffer.from(parts[2], "hex")
    if (salt.length === 0 || expected.length === 0) return false
    const actual = scryptSync(candidate, salt, expected.length)
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export async function isAdminConfigured(): Promise<boolean> {
  const envReady =
    typeof process.env.ADMIN_PASSWORD === "string" &&
    process.env.ADMIN_PASSWORD.length >= 8
  if (envReady) return true
  return (await getStoredPasswordHash()) !== null
}

/** Comparaison du mot de passe d'environnement, à temps constant (tests). */
export function verifyEnvAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (typeof expected !== "string" || expected.length < 8 || !candidate) {
    return false
  }
  const a = createHash("sha256").update(candidate, "utf8").digest()
  const b = createHash("sha256").update(expected, "utf8").digest()
  return timingSafeEqual(a, b)
}

/**
 * Vérifie le mot de passe administrateur : empreinte scrypt de la base si un
 * changement a eu lieu, sinon ADMIN_PASSWORD (comparaison à temps constant
 * via empreintes sha256 de longueur égale).
 */
export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  if (!candidate) return false

  const stored = await getStoredPasswordHash()
  if (stored) {
    if (scryptMatches(candidate, stored)) return true
    // Empreinte illisible → secours env plutôt qu'administrateur bloqué.
    if (!stored.startsWith("scrypt:")) {
      console.error("[admin-auth] empreinte de mot de passe malformée — secours env")
    } else {
      return false
    }
  }

  return verifyEnvAdminPassword(candidate)
}

export type PasswordChangeResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

/**
 * Change le mot de passe administrateur : exige le mot de passe actuel,
 * refuse un mot de passe identique au précédent, puis persiste l'empreinte
 * scrypt en base (la variable ADMIN_PASSWORD devient inopérante).
 */
export async function changeAdminPassword(
  current: string,
  next: string
): Promise<PasswordChangeResult> {
  if (!(await verifyAdminPassword(current))) {
    return { ok: false, status: 401, error: "Mot de passe actuel incorrect" }
  }
  if (next === current) {
    return {
      ok: false,
      status: 400,
      error: "Le nouveau mot de passe doit être différent de l'actuel",
    }
  }
  await db.siteSetting.upsert({
    where: { key: PASSWORD_SETTING_KEY },
    create: { key: PASSWORD_SETTING_KEY, value: scryptEncode(next) },
    update: { value: scryptEncode(next) },
  })
  return { ok: true }
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

/* ------------------------------ Journal d'audit ---------------------------- */

/**
 * Trace une action sensible dans AuditLog. Fire-and-forget : une panne de la
 * base ne doit jamais bloquer la requête protégée.
 */
export function audit(
  action: "login.success" | "login.failed" | "login.rate-limited" | "admin.mutation",
  detail: { method: string; path: string; ip: string }
): void {
  void db.auditLog
    .create({
      data: {
        action,
        method: detail.method.toUpperCase().slice(0, 10),
        path: detail.path.slice(0, 200),
        ip: detail.ip.slice(0, 64),
      },
    })
    .catch((error) => {
      console.error("[audit] écriture impossible", error)
    })
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
 * Toute mutation autorisée est tracée dans le journal d'audit.
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

  // Traçabilité des actions de gestion (hors lectures).
  const method = request.method.toUpperCase()
  if (method !== "GET" && method !== "HEAD") {
    try {
      const path = new URL(request.url).pathname
      audit("admin.mutation", { method, path, ip: clientIp(request) })
    } catch {
      // URL inexploitable : pas de trace, mais requête autorisée
    }
  }
  return null
}
