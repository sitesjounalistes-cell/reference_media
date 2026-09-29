import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/ads — liste des campagnes actives affichables dans les emplacements.
 * Les créas sont servies par la régie maison ; le filtrage par emplacement
 * (champ `slots`) est effectué côté client afin de mutualiser une seule requête.
 */
export async function GET() {
  try {
    const raw = await db.adCampaign.findMany({
      where: { active: true },
      orderBy: [{ weight: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        advertiser: true,
        headline: true,
        body: true,
        ctaLabel: true,
        ctaView: true,
        color: true,
        imageUrl: true,
        slots: true,
      },
    })

    const campaigns = raw.map((campaign) => ({
      ...campaign,
      slots: campaign.slots
        .split(",")
        .map((slot) => slot.trim())
        .filter(Boolean),
    }))

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("GET /api/ads", error)
    return NextResponse.json(
      { error: "Impossible de charger les campagnes publicitaires" },
      { status: 500 }
    )
  }
}
