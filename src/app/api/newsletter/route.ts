import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const newsletterSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide" }).max(254),
})

/** POST /api/newsletter — inscription à la newsletter (idempotent).
 * Limité à 5 inscriptions / 10 min / IP ; réponse identique que l'email
 * existe déjà ou non (anti-énumération d'adresses). */
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`newsletter:${clientIp(request)}`, 5, 10 * 60 * 1000)
    if (!limit.ok) return tooManyRequests(limit.retryAfterS)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Requête invalide : JSON attendu" },
        { status: 400 }
      )
    }

    const parsed = newsletterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Adresse e-mail invalide" },
        { status: 400 }
      )
    }

    const email = parsed.data.email.toLowerCase().trim()
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing) {
      // Même réponse que pour une nouvelle inscription : ne pas révéler
      // qu'une adresse figure déjà dans la base.
      return NextResponse.json({
        ok: true,
        message: "Merci ! Vous êtes bien inscrit·e à la newsletter.",
      })
    }

    await db.newsletterSubscriber.create({ data: { email } })

    return NextResponse.json({
      ok: true,
      message: "Merci ! Vous êtes bien inscrit·e à la newsletter.",
    })
  } catch (error) {
    console.error("POST /api/newsletter", error)
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'inscription" },
      { status: 500 }
    )
  }
}
