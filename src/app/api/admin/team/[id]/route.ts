import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  invalidBody,
  noContent,
  readJsonBody,
  teamPatchSchema,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** PATCH /api/admin/team/[id] — met à jour partiellement un membre. */
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

    const parsed = teamPatchSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Membre invalide")

    const existing = await db.teamMember.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Membre de l'équipe introuvable" },
        { status: 404 }
      )
    }

    const member = await db.teamMember.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error("PATCH /api/admin/team/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier le membre de l'équipe" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/team/[id] — supprime le membre. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.teamMember.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Membre de l'équipe introuvable" },
        { status: 404 }
      )
    }

    await db.teamMember.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/team/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer le membre de l'équipe" },
      { status: 500 }
    )
  }
}
