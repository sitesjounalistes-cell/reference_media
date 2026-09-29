import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * Les 8 emplacements publicitaires réellement servis par AdSlot
 * (contrat AD_SLOTS de _lib.ts) : top, leaderboard, sidebar, rail-left,
 * rail-right, inline, billboard, bottom.
 */
const SLOTS = [
  "top",
  "leaderboard",
  "sidebar",
  "rail-left",
  "rail-right",
  "inline",
  "billboard",
  "bottom",
] as const

const trackSchema = z.object({
  campaignId: z.string({ error: "Campagne requise" }).min(1).max(64),
  slot: z.enum(SLOTS, { error: "Emplacement invalide" }),
  type: z.enum(["impression", "click"], { error: "Type d'événement invalide" }),
})

/**
 * POST /api/ads/track — enregistre une impression ou un clic publicitaire.
 * Le tracking est volontairement silencieux : en cas de campagne inconnue ou
 * de payload invalide, on répond 200 pour ne pas polluer la console cliente.
 * Limité : 120 événements / min / IP (anti-bourrage des statistiques).
 */
export async function POST(request: Request) {
  try {
    // Silencieux même en cas de quota dépassé : le tracking ne doit jamais
    // remonter d'erreur visible côté lecteur.
    const limit = rateLimit(`ads-track:${clientIp(request)}`, 120, 60 * 1000)
    if (!limit.ok) return NextResponse.json({ ok: false }, { status: 200 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const parsed = trackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const { campaignId, slot, type } = parsed.data

    const campaign = await db.adCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, active: true },
    })
    if (!campaign || !campaign.active) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    await db.adEvent.create({ data: { campaignId, slot, type } })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("POST /api/ads/track", error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
