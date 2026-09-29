import { rm } from "fs/promises"
import { join } from "path"

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { noContent } from "../../_lib"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const UPLOADS_DIR = join(process.cwd(), "public", "uploads")

/** DELETE /api/admin/media/[id] — supprime le fichier disque et sa fiche. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const asset = await db.mediaAsset.findUnique({ where: { id } })
    if (!asset) {
      return NextResponse.json({ error: "Média introuvable" }, { status: 404 })
    }

    // Suppression du fichier : silencieuse (le fichier peut déjà avoir disparu).
    try {
      await rm(join(UPLOADS_DIR, asset.filename), { force: true })
    } catch {
      // ignoré volontairement
    }

    await db.mediaAsset.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/media/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer le média" },
      { status: 500 }
    )
  }
}
