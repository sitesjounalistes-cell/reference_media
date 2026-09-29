import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  campaignInputSchema,
  fetchAdStats,
  invalidBody,
  mapCampaign,
  readJsonBody,
} from "../_lib"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/campaigns — toutes les campagnes (création décroissante)
 * avec leurs impressions / clics / CTR.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const [rows, stats] = await Promise.all([
      db.adCampaign.findMany({ orderBy: [{ createdAt: "desc" }] }),
      fetchAdStats(),
    ])

    return NextResponse.json({
      campaigns: rows.map((row) => mapCampaign(row, stats.get(row.id))),
    })
  } catch (error) {
    console.error("GET /api/admin/campaigns", error)
    return NextResponse.json(
      { error: "Impossible de charger les campagnes" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/campaigns — crée une campagne (slots stockés en CSV). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = campaignInputSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Campagne invalide")
    }

    const data = parsed.data
    const campaign = await db.adCampaign.create({
      data: {
        name: data.name,
        advertiser: data.advertiser,
        headline: data.headline,
        body: data.body,
        ctaLabel: data.ctaLabel,
        ctaView: data.ctaView,
        color: data.color,
        imageUrl: data.imageUrl,
        slots: data.slots.join(","),
        active: data.active,
        weight: data.weight,
      },
    })

    return NextResponse.json(
      { campaign: mapCampaign(campaign, undefined) },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/admin/campaigns", error)
    return NextResponse.json(
      { error: "Impossible de créer la campagne" },
      { status: 500 }
    )
  }
}
