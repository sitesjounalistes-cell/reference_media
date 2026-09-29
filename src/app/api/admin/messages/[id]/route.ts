import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  invalidBody,
  mapAdminMessage,
  noContent,
  readJsonBody,
} from "../../_lib"

export const dynamic = "force-dynamic"

const messagePatchSchema = z.object({
  read: z.boolean({ error: "Lu : booléen attendu" }),
})

/** PATCH /api/admin/messages/[id] — marque un message comme lu / non lu. */
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

    const parsed = messagePatchSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Message invalide")

    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Message introuvable" },
        { status: 404 }
      )
    }

    const message = await db.contactMessage.update({
      where: { id },
      data: { read: parsed.data.read },
    })

    return NextResponse.json({ message: mapAdminMessage(message) })
  } catch (error) {
    console.error("PATCH /api/admin/messages/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier le message" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/messages/[id] — supprime le message. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Message introuvable" },
        { status: 404 }
      )
    }

    await db.contactMessage.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/messages/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer le message" },
      { status: 500 }
    )
  }
}
