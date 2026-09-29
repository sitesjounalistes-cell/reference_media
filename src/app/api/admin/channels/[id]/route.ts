import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  channelPatchSchema,
  invalidBody,
  noContent,
  readJsonBody,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** PATCH /api/admin/channels/[id] — met à jour partiellement un canal. */
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

    const parsed = channelPatchSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Canal invalide")

    const existing = await db.contactChannel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Canal introuvable" }, { status: 404 })
    }

    const channel = await db.contactChannel.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ channel })
  } catch (error) {
    console.error("PATCH /api/admin/channels/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier le canal de contact" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/channels/[id] — supprime le canal. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.contactChannel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Canal introuvable" }, { status: 404 })
    }

    await db.contactChannel.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/channels/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer le canal de contact" },
      { status: 500 }
    )
  }
}
