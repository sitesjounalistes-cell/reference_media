import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  invalidBody,
  noContent,
  readJsonBody,
  socialPatchSchema,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** PATCH /api/admin/socials/[id] — met à jour partiellement un réseau social. */
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

    const parsed = socialPatchSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Réseau social invalide")
    }

    const existing = await db.socialLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Réseau social introuvable" },
        { status: 404 }
      )
    }

    const social = await db.socialLink.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ social })
  } catch (error) {
    console.error("PATCH /api/admin/socials/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier le réseau social" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/socials/[id] — supprime le réseau social. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.socialLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Réseau social introuvable" },
        { status: 404 }
      )
    }

    await db.socialLink.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/socials/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer le réseau social" },
      { status: 500 }
    )
  }
}
