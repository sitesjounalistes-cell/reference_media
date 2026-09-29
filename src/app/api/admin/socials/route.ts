import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { invalidBody, readJsonBody, socialInputSchema } from "../_lib"

export const dynamic = "force-dynamic"

/** GET /api/admin/socials — tous les réseaux sociaux (y compris masqués). */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const rows = await db.socialLink.findMany({
      orderBy: [{ order: "asc" }],
    })
    return NextResponse.json({ socials: rows })
  } catch (error) {
    console.error("GET /api/admin/socials", error)
    return NextResponse.json(
      { error: "Impossible de charger les réseaux sociaux" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/socials — ajoute un réseau social (ordre = max + 1 si absent). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = socialInputSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Réseau social invalide")
    }

    const data = parsed.data
    let order = data.order
    if (order === undefined) {
      const agg = await db.socialLink.aggregate({ _max: { order: true } })
      order = (agg._max.order ?? 0) + 1
    }

    const social = await db.socialLink.create({
      data: {
        platform: data.platform,
        url: data.url,
        order,
        visible: data.visible ?? true,
      },
    })

    return NextResponse.json({ social }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/socials", error)
    return NextResponse.json(
      { error: "Impossible de créer le réseau social" },
      { status: 500 }
    )
  }
}
