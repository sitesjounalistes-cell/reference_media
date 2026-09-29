import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { mapAdminMessage } from "../_lib"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/overview — vue d'ensemble du cockpit (compteurs temps réel)
 * + les 6 derniers messages de contact. Réservé à la rédaction.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const [
      total,
      published,
      draft,
      hidden,
      viewsAgg,
      mediaAgg,
      messagesTotal,
      messagesUnread,
      subscribers,
      campaignsTotal,
      campaignsActive,
      categories,
      authors,
      recentRows,
    ] = await Promise.all([
      db.article.count(),
      db.article.count({ where: { status: "PUBLISHED" } }),
      db.article.count({ where: { status: "DRAFT" } }),
      db.article.count({ where: { status: "HIDDEN" } }),
      db.article.aggregate({ _sum: { views: true } }),
      db.mediaAsset.aggregate({ _count: true, _sum: { size: true } }),
      db.contactMessage.count(),
      db.contactMessage.count({ where: { read: false } }),
      db.newsletterSubscriber.count(),
      db.adCampaign.count(),
      db.adCampaign.count({ where: { active: true } }),
      db.category.count(),
      db.author.count(),
      db.contactMessage.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 6,
      }),
    ])

    return NextResponse.json({
      overview: {
        articles: { total, published, draft, hidden },
        totalViews: viewsAgg._sum.views ?? 0,
        media: { count: mediaAgg._count, totalSize: mediaAgg._sum.size ?? 0 },
        messages: { total: messagesTotal, unread: messagesUnread },
        subscribers,
        campaigns: { total: campaignsTotal, active: campaignsActive },
        categories,
        authors,
      },
      recentMessages: recentRows.map(mapAdminMessage),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/overview", error)
    return NextResponse.json(
      { error: "Impossible de charger la vue d'ensemble du cockpit" },
      { status: 500 }
    )
  }
}
