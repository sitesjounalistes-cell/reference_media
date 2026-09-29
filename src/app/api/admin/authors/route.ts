import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  authorInputSchema,
  computeInitials,
  invalidBody,
  mapAdminAuthor,
  readJsonBody,
} from "../_lib"

export const dynamic = "force-dynamic"

/** GET /api/admin/authors — l'équipe, avec le nombre d'articles (nom croissant). */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const rows = await db.author.findMany({
      orderBy: [{ name: "asc" }],
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json({ authors: rows.map(mapAdminAuthor) })
  } catch (error) {
    console.error("GET /api/admin/authors", error)
    return NextResponse.json(
      { error: "Impossible de charger les auteurs" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/authors — crée un auteur (initiales calculées depuis le nom). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = authorInputSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Auteur invalide")

    const data = parsed.data
    const author = await db.author.create({
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio,
        initials: computeInitials(data.name),
        color: data.color ?? "#1B5FD9",
      },
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json({ author: mapAdminAuthor(author) }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/authors", error)
    return NextResponse.json(
      { error: "Impossible de créer l'auteur" },
      { status: 500 }
    )
  }
}
