import { NextResponse } from "next/server"
import { z } from "zod"

import {
  ADMIN_COOKIE,
  assertSameOrigin,
  audit,
  createSessionToken,
  isAdminConfigured,
  sessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin-auth"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const loginSchema = z.object({
  password: z
    .string({ error: "Mot de passe requis" })
    .min(1, "Mot de passe requis")
    .max(200, "Mot de passe trop long"),
})

/**
 * POST /api/admin/login — ouvre une session cockpit.
 * Rate limité : 10 tentatives / 10 min / IP (anti brute-force).
 */
export async function POST(request: Request) {
  try {
    const originDenied = assertSameOrigin(request)
    if (originDenied) return originDenied

    const limit = rateLimit(`login:${clientIp(request)}`, 10, 10 * 60 * 1000)
    if (!limit.ok) {
      audit("login.rate-limited", { method: "POST", path: "/api/admin/login", ip: clientIp(request) })
      return tooManyRequests(limit.retryAfterS)
    }

    if (!isAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            "Administration non configurée : définissez ADMIN_PASSWORD (≥ 8 caractères) dans le fichier .env",
        },
        { status: 500 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Requête invalide : JSON attendu" },
        { status: 400 }
      )
    }

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Mot de passe requis" },
        { status: 400 }
      )
    }

    if (!verifyAdminPassword(parsed.data.password)) {
      audit("login.failed", { method: "POST", path: "/api/admin/login", ip: clientIp(request) })
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 })
    }

    audit("login.success", { method: "POST", path: "/api/admin/login", ip: clientIp(request) })

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions())
    return response
  } catch (error) {
    console.error("POST /api/admin/login", error)
    return NextResponse.json(
      { error: "Impossible de se connecter pour le moment" },
      { status: 500 }
    )
  }
}
