import { NextResponse } from "next/server"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/* ------------------------------- Constantes ------------------------------- */

const TRAFFIC_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

/* -------------------------------- Utilitaires ----------------------------- */

/** Hash déterministe (FNV-1a) → nombre dans [0, 1). */
function hash01(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/** Début de journée (00:00 local) décalé de `offsetDays`. */
function startOfDay(offsetDays: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - offsetDays)
  return d
}

/**
 * Répartit les lectures cumulées de chaque article sur les 14 derniers jours.
 * Estimation déterministe : pondération récente + variation par article/jour,
 * calibrée pour rester cohérente avec le total réel de lectures.
 */
function estimateTraffic(
  articles: Array<{ slug: string; views: number; publishedAt: Date }>
) {
  const days = Array.from({ length: TRAFFIC_DAYS }, (_, i) =>
    startOfDay(TRAFFIC_DAYS - 1 - i)
  )
  const dayEnds = days.map((d) => d.getTime() + DAY_MS)
  const now = Date.now()
  const buckets = new Array<number>(TRAFFIC_DAYS).fill(0)

  for (const article of articles) {
    if (article.views <= 0) continue
    const publishedAt = article.publishedAt.getTime()
    const ageDays = Math.max(1, Math.ceil((now - publishedAt) / DAY_MS))
    // On lisse sur une fenêtre minimum de 14 jours (cohérence 14 j ≤ total).
    const activeDays = Math.max(TRAFFIC_DAYS, ageDays)
    const dailyBase = article.views / activeDays

    for (let i = 0; i < TRAFFIC_DAYS; i++) {
      const end = i === TRAFFIC_DAYS - 1 ? now : dayEnds[i]
      if (publishedAt > end) continue
      const recency = 0.55 + 0.45 * (i / (TRAFFIC_DAYS - 1))
      const jitter = 0.78 + hash01(`${article.slug}:${i}`) * 0.44
      buckets[i] += dailyBase * recency * jitter
    }
  }

  return buckets.map((views, i) => ({
    date: format(days[i], "yyyy-MM-dd"),
    label: format(days[i], "d MMM", { locale: fr }),
    views: Math.round(views),
  }))
}

/* --------------------------------- Route ---------------------------------- */

/** GET /api/dashboard — agrégats éditoriaux et publicitaires du portail. */
export async function GET() {
  try {
    const rangeStart = startOfDay(TRAFFIC_DAYS - 1)

    const [
      articleCount,
      categoryCount,
      authorCount,
      viewAggregate,
      subscriberCount,
      messageCount,
      adImpressions,
      adClicks,
      readMinutesAggregate,
      articlesForTraffic,
      articlesByCategory,
      topArticlesRaw,
      adEventsInRange,
      campaigns,
      latestSubscribers,
      latestMessages,
    ] = await Promise.all([
      db.article.count(),
      db.category.count(),
      db.author.count(),
      db.article.aggregate({ _sum: { views: true } }),
      db.newsletterSubscriber.count(),
      db.contactMessage.count(),
      db.adEvent.count({ where: { type: "impression", createdAt: { gte: rangeStart } } }),
      db.adEvent.count({ where: { type: "click", createdAt: { gte: rangeStart } } }),
      db.article.aggregate({ _avg: { readMinutes: true } }),
      db.article.findMany({
        select: { slug: true, views: true, publishedAt: true },
      }),
      db.article.groupBy({
        by: ["categoryId"],
        _count: { _all: true },
        _sum: { views: true },
      }),
      db.article.findMany({
        orderBy: [{ views: "desc" }],
        take: 6,
        select: {
          slug: true,
          title: true,
          views: true,
          readMinutes: true,
          publishedAt: true,
          category: { select: { name: true, color: true } },
          author: { select: { name: true } },
        },
      }),
      db.adEvent.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { type: true, createdAt: true },
      }),
      db.adCampaign.findMany({
        orderBy: [{ active: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          advertiser: true,
          headline: true,
          color: true,
          slots: true,
          active: true,
        },
      }),
      db.newsletterSubscriber.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        // ⚠️ Route PUBLIQUE : aucune donnée personnelle (email) ne doit
        // sortir — seules les dates d'inscription sont exposées.
        select: { createdAt: true },
      }),
      db.contactMessage.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        // Idem : sujet et date seulement, ni nom ni email.
        select: { subject: true, createdAt: true },
      }),
    ])

    /* ------------------------------ Série audience ------------------------- */
    const traffic = estimateTraffic(articlesForTraffic)

    /* ------------------------------ Série publicité ------------------------ */
    const adBuckets = new Array<number>(TRAFFIC_DAYS).fill(0)
    const clickBuckets = new Array<number>(TRAFFIC_DAYS).fill(0)
    for (const event of adEventsInRange) {
      const index = Math.floor((event.createdAt.getTime() - rangeStart.getTime()) / DAY_MS)
      if (index < 0 || index >= TRAFFIC_DAYS) continue
      if (event.type === "impression") adBuckets[index] += 1
      else if (event.type === "click") clickBuckets[index] += 1
    }
    const adSeries = adBuckets.map((impressions, i) => ({
      date: format(startOfDay(TRAFFIC_DAYS - 1 - i), "yyyy-MM-dd"),
      label: format(startOfDay(TRAFFIC_DAYS - 1 - i), "d MMM", { locale: fr }),
      impressions,
      clicks: clickBuckets[i],
    }))

    /* --------------------------- Lectures par rubrique --------------------- */
    const categories = await db.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, color: true },
    })
    const byCategory = new Map(articlesByCategory.map((row) => [row.categoryId, row]))
    const totalCategoryViews = articlesByCategory.reduce(
      (sum, row) => sum + (row._sum.views ?? 0),
      0
    )
    const categoryStats = categories
      .map((category) => {
        const row = byCategory.get(category.id)
        const articles = row?._count._all ?? 0
        const views = row?._sum.views ?? 0
        return {
          slug: category.slug,
          name: category.name,
          color: category.color,
          articles,
          views,
          share:
            totalCategoryViews > 0
              ? Math.round((views / totalCategoryViews) * 1000) / 10
              : 0,
        }
      })
      .sort((a, b) => b.views - a.views)

    /* -------------------------- Performance campagnes ---------------------- */
    const grouped = await db.adEvent.groupBy({
      by: ["campaignId", "type"],
      where: { createdAt: { gte: rangeStart } },
      _count: { _all: true },
    })
    const statsByCampaign = new Map<string, { impressions: number; clicks: number }>()
    for (const row of grouped) {
      const entry = statsByCampaign.get(row.campaignId) ?? { impressions: 0, clicks: 0 }
      if (row.type === "impression") entry.impressions += row._count._all
      if (row.type === "click") entry.clicks += row._count._all
      statsByCampaign.set(row.campaignId, entry)
    }
    const campaignStats = campaigns.map((campaign) => {
      const stats = statsByCampaign.get(campaign.id) ?? { impressions: 0, clicks: 0 }
      return {
        id: campaign.id,
        name: campaign.name,
        advertiser: campaign.advertiser,
        headline: campaign.headline,
        color: campaign.color,
        slots: campaign.slots.split(",").map((s) => s.trim()).filter(Boolean),
        active: campaign.active,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr:
          stats.impressions > 0
            ? Math.round((stats.clicks / stats.impressions) * 1000) / 10
            : 0,
      }
    })

    /* ---------------------------------- KPIs -------------------------------- */
    const totalViews = viewAggregate._sum.views ?? 0
    const kpis = {
      articles: articleCount,
      categories: categoryCount,
      authors: authorCount,
      totalViews,
      subscribers: subscriberCount,
      messages: messageCount,
      adImpressions,
      adClicks,
      adCtr:
        adImpressions > 0
          ? Math.round((adClicks / adImpressions) * 1000) / 10
          : 0,
      avgReadMinutes: Math.round((readMinutesAggregate._avg.readMinutes ?? 0) * 10) / 10,
    }

    return NextResponse.json({
      kpis,
      traffic,
      adSeries,
      categories: categoryStats,
      topArticles: topArticlesRaw.map((article) => ({
        slug: article.slug,
        title: article.title,
        views: article.views,
        readMinutes: article.readMinutes,
        publishedAt: article.publishedAt.toISOString(),
        category: article.category,
        author: article.author,
      })),
      campaigns: campaignStats,
      subscribers: latestSubscribers.map((s) => ({
        createdAt: s.createdAt.toISOString(),
      })),
      messages: latestMessages.map((m) => ({
        subject: m.subject,
        createdAt: m.createdAt.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET /api/dashboard", error)
    return NextResponse.json(
      { error: "Impossible de charger les statistiques du tableau de bord" },
      { status: 500 }
    )
  }
}
