import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  channelInputSchema,
  invalidBody,
  readJsonBody,
} from "../_lib"

export const dynamic = "force-dynamic"

/** GET /api/admin/channels — annuaire complet (y compris les canaux masqués). */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const rows = await db.contactChannel.findMany({
      orderBy: [{ order: "asc" }],
    })
    return NextResponse.json({ channels: rows })
  } catch (error) {
    console.error("GET /api/admin/channels", error)
    return NextResponse.json(
      { error: "Impossible de charger l'annuaire de contact" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/channels — ajoute un canal (ordre = max + 1 si absent). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = channelInputSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Canal invalide")

    const data = parsed.data
    let order = data.order
    if (order === undefined) {
      const agg = await db.contactChannel.aggregate({ _max: { order: true } })
      order = (agg._max.order ?? 0) + 1
    }

    const channel = await db.contactChannel.create({
      data: {
        type: data.type,
        label: data.label,
        value: data.value,
        order,
        visible: data.visible,
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/channels", error)
    return NextResponse.json(
      { error: "Impossible de créer le canal de contact" },
      { status: 500 }
    )
  }
}
