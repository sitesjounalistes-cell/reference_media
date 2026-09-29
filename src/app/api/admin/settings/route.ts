import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { invalidBody, readJsonBody } from "../_lib"

export const dynamic = "force-dynamic"

const settingsSchema = z.record(
  z.string().min(1, "Clé de paramètre invalide"),
  z.string().max(4000, "Chaque valeur ne peut pas dépasser 4 000 caractères")
)

function toRecord(rows: { key: string; value: string }[]) {
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value
  return settings
}

/** GET /api/admin/settings — toutes les paires clé/valeur du site. */
export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const rows = await db.siteSetting.findMany()
    return NextResponse.json({ settings: toRecord(rows) })
  } catch (error) {
    console.error("GET /api/admin/settings", error)
    return NextResponse.json(
      { error: "Impossible de charger les paramètres du site" },
      { status: 500 }
    )
  }
}

/** PUT /api/admin/settings — enregistre chaque clé (upsert en transaction). */
export async function PUT(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = settingsSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Paramètres invalides")

    const entries = Object.entries(parsed.data)
    await db.$transaction(
      entries.map(([key, value]) =>
        db.siteSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    )

    const rows = await db.siteSetting.findMany()
    return NextResponse.json({ settings: toRecord(rows) })
  } catch (error) {
    console.error("PUT /api/admin/settings", error)
    return NextResponse.json(
      { error: "Impossible d'enregistrer les paramètres du site" },
      { status: 500 }
    )
  }
}
