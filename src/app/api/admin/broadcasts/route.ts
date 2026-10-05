import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin-auth"
import { cloudinaryConfigured, cloudinaryUpload } from "@/lib/cloudinary"
import { db } from "@/lib/db"
import { isSafeAssetUrl } from "@/app/api/admin/_lib"

export const dynamic = "force-dynamic"

const SECTIONS = ["podcast", "chronique", "interview", "reportage", "emission"] as const

const broadcastSchema = z.object({
  kind: z.enum(["AUDIO", "VIDEO"], { error: "Type invalide" }),
  section: z.enum(SECTIONS, { error: "Section invalide" }),
  title: z.string().trim().min(3, "Titre : 3 caractères minimum").max(200),
  description: z.string().trim().min(10, "Description : 10 caractères minimum").max(600),
  mediaUrl: z.string().trim().min(1, "Média requis").max(1000).refine(isSafeAssetUrl, "URL invalide"),
  duration: z.number().int().min(1).max(600).nullable().optional(),
  thumbnailUrl: z.string().trim().max(1000).nullable().optional().refine(isSafeAssetUrl, "URL de visuel invalide"),
  isLive: z.boolean().optional(),
  featured: z.boolean().optional(),
})

function map(row: {
  id: string; kind: string; section: string; title: string; description: string
  mediaUrl: string; thumbnailUrl: string | null; isLive: boolean; duration: number | null; featured: boolean; publishedAt: Date
}) {
  return { ...row, publishedAt: row.publishedAt.toISOString() }
}

/** GET /api/admin/broadcasts?kind=AUDIO|VIDEO — gestion cockpit. */
export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const kind = new URL(request.url).searchParams.get("kind") === "VIDEO" ? "VIDEO" : "AUDIO"
    const rows = await db.broadcast.findMany({
      where: { kind },
      orderBy: [{ publishedAt: "desc" }],
    })
    return NextResponse.json({ broadcasts: rows.map(map) })
  } catch (error) {
    console.error("GET /api/admin/broadcasts", error)
    return NextResponse.json({ error: "Impossible de charger les programmes" }, { status: 500 })
  }
}

/** POST /api/admin/broadcasts — publie un contenu FM ou TV. */
export async function POST(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const body = (await request.json()) as Record<string, unknown>
    // Import Google Drive (sans API) : { importDrive: "https://drive.google.com/file/d/…/view" }
    if (typeof body.importDrive === "string") {
      const match = body.importDrive.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]{10,})/)
      if (!match) {
        return NextResponse.json(
          { error: "Lien Google Drive non reconnu — utilisez le lien de partage du FICHIER (pas d'un dossier)." },
          { status: 400 }
        )
      }
      if (!cloudinaryConfigured()) {
        return NextResponse.json(
          { error: "Cloudinary non configuré — ajoutez CLOUDINARY_* dans l'environnement." },
          { status: 500 }
        )
      }
      try {
        const direct = "https://drive.google.com/uc?export=download&id=" + match[1]
        const res = await fetch(direct, { redirect: "follow", signal: AbortSignal.timeout(120000) })
        if (!res.ok) throw new Error("Drive HTTP " + res.status)
        const contentType = res.headers.get("content-type") ?? ""
        if (!/^(audio|video|application\/octet-stream)/.test(contentType)) {
          throw new Error("Le lien ne pointe pas directement vers un média (fichier privé ou trop volumineux ?)")
        }
        const buffer = Buffer.from(await res.arrayBuffer())
        if (buffer.length > 200 * 1024 * 1024) throw new Error("Fichier trop volumineux (200 Mo maximum)")
        const kind = contentType.startsWith("video") ? "VIDEO" : "AUDIO"
        const uploaded = await cloudinaryUpload(buffer, kind, match[1])
        return NextResponse.json({ imported: { url: uploaded.secureUrl, kind } })
      } catch (err) {
        return NextResponse.json(
          { error: "Import Drive impossible : " + (err instanceof Error ? err.message : "erreur inconnue") },
          { status: 400 }
        )
      }
    }
    const parsed = broadcastSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Contenu invalide" }, { status: 400 })
    }
    const data = parsed.data
    const created = await db.broadcast.create({
      data: {
        kind: data.kind,
        section: data.section,
        title: data.title,
        description: data.description,
        mediaUrl: data.mediaUrl,
        duration: data.duration ?? null,
        thumbnailUrl: data.thumbnailUrl || null,
        isLive: data.isLive ?? false,
        featured: data.featured ?? false,
      },
    })
    return NextResponse.json({ broadcast: map(created) }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/broadcasts", error)
    return NextResponse.json({ error: "Impossible de publier le programme" }, { status: 500 })
  }
}

/** PATCH /api/admin/broadcasts?id=… — met à jour (mise en avant…). */
export async function PATCH(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const id = new URL(request.url).searchParams.get("id") ?? ""
    const body = (await request.json()) as Record<string, unknown>
    const patch: Record<string, unknown> = {}
    if (typeof body.featured === "boolean") patch.featured = body.featured
    if (typeof body.title === "string") patch.title = body.title.slice(0, 200)
    if (typeof body.description === "string") patch.description = body.description.slice(0, 600)
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Rien à modifier" }, { status: 400 })
    }
    const updated = await db.broadcast.update({ where: { id }, data: patch })
    return NextResponse.json({ broadcast: map(updated) })
  } catch {
    return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
  }
}

/** DELETE /api/admin/broadcasts?id=… — supprime définitivement. */
export async function DELETE(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const id = new URL(request.url).searchParams.get("id") ?? ""
    await db.broadcast.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Programme introuvable" }, { status: 404 })
  }
}
