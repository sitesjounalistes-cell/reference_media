import { NextResponse } from "next/server"
import { z } from "zod"

import { changeAdminPassword, requireAdmin } from "@/lib/admin-auth"
import { invalidBody, readJsonBody } from "../_lib"

export const dynamic = "force-dynamic"

const passwordChangeSchema = z.object({
  currentPassword: z
    .string({ error: "Mot de passe actuel requis" })
    .min(1, "Mot de passe actuel requis")
    .max(200, "Mot de passe trop long"),
  newPassword: z
    .string({ error: "Nouveau mot de passe requis" })
    .min(10, "Le nouveau mot de passe doit contenir au moins 10 caractères")
    .max(200, "Le nouveau mot de passe ne peut pas dépasser 200 caractères"),
})

/**
 * PUT /api/admin/password — change le mot de passe administrateur.
 * Exige la session courante ET le mot de passe actuel (double contrôle) ;
 * le nouveau mot de passe est stocké en empreinte scrypt salée.
 */
export async function PUT(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = passwordChangeSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Changement de mot de passe invalide")
    }

    const result = await changeAdminPassword(
      parsed.data.currentPassword,
      parsed.data.newPassword
    )
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PUT /api/admin/password", error)
    return NextResponse.json(
      { error: "Impossible de changer le mot de passe pour le moment" },
      { status: 500 }
    )
  }
}
