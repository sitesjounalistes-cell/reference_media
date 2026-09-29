import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { mapAdminMessage } from "../_lib"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/messages — les 200 derniers messages de contact.
 * ?filter=unread (non lus uniquement) | all (défaut).
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const filter = request.nextUrl.searchParams.get("filter") ?? "all"

    const rows = await db.contactMessage.findMany({
      where: filter === "unread" ? { read: false } : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    })

    return NextResponse.json({ messages: rows.map(mapAdminMessage) })
  } catch (error) {
    console.error("GET /api/admin/messages", error)
    return NextResponse.json(
      { error: "Impossible de charger les messages" },
      { status: 500 }
    )
  }
}
