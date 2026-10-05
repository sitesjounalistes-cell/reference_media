import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/broadcasts?kind=AUDIO|VIDEO — contenus FM/TV structurés,
 * du plus récent au plus ancien, section transmise telle quelle.
 */
export async function GET(request: Request) {
  try {
    const kind = new URL(request.url).searchParams.get("kind") === "VIDEO" ? "VIDEO" : "AUDIO"
    const rows = await db.broadcast.findMany({
      where: { kind },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 60,
    })
    return NextResponse.json({
      broadcasts: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        section: row.section,
        title: row.title,
        description: row.description,
        mediaUrl: row.mediaUrl,
        duration: row.duration,
        featured: row.featured,
        publishedAt: row.publishedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("GET /api/broadcasts", error)
    return NextResponse.json({ error: "Impossible de charger les programmes" }, { status: 500 })
  }
}
