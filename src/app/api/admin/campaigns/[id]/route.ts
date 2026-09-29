import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  campaignPatchSchema,
  fetchAdStats,
  invalidBody,
  mapCampaign,
  noContent,
  readJsonBody,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** PATCH /api/admin/campaigns/[id] — met à jour partiellement une campagne. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = campaignPatchSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Campagne invalide")
    }

    const existing = await db.adCampaign.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }

    const data = parsed.data
    const campaign = await db.adCampaign.update({
      where: { id },
      data: {
        name: data.name,
        advertiser: data.advertiser,
        headline: data.headline,
        body: data.body,
        ctaLabel: data.ctaLabel,
        ctaView: data.ctaView,
        color: data.color,
        imageUrl: data.imageUrl,
        slots: data.slots !== undefined ? data.slots.join(",") : undefined,
        active: data.active,
        weight: data.weight,
      },
    })

    const stats = await fetchAdStats()
    return NextResponse.json({
      campaign: mapCampaign(campaign, stats.get(campaign.id)),
    })
  } catch (error) {
    console.error("PATCH /api/admin/campaigns/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier la campagne" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/campaigns/[id] — supprime la campagne (événements cascadés). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.adCampaign.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      )
    }

    await db.adCampaign.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/campaigns/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer la campagne" },
      { status: 500 }
    )
  }
}
