import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { invalidBody, readJsonBody, teamInputSchema } from "../_lib"

export const dynamic = "force-dynamic"

/** GET /api/admin/team — équipe complète (y compris les membres masqués). */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const members = await db.teamMember.findMany({
      orderBy: [{ order: "asc" }],
    })
    return NextResponse.json({ members })
  } catch (error) {
    console.error("GET /api/admin/team", error)
    return NextResponse.json(
      { error: "Impossible de charger l'équipe éditoriale" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/team — ajoute un membre (ordre = max + 1 si absent). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = teamInputSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Membre invalide")

    const data = parsed.data
    let order = data.order
    if (order === undefined) {
      const agg = await db.teamMember.aggregate({ _max: { order: true } })
      order = (agg._max.order ?? 0) + 1
    }

    const member = await db.teamMember.create({
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio,
        photoUrl: data.photoUrl ?? null,
        order,
        visible: data.visible,
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/team", error)
    return NextResponse.json(
      { error: "Impossible d'ajouter le membre de l'équipe" },
      { status: 500 }
    )
  }
}
