import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/** Sujets proposés dans le formulaire de contact. */
export const CONTACT_SUBJECTS = [
  "redaction",
  "correction",
  "partenariat",
  "publicite",
  "droits",
  "autre",
] as const

const contactSchema = z.object({
  name: z
    .string({ error: "Le nom est requis" })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(80, "Le nom ne peut pas dépasser 80 caractères"),
  email: z.email({ error: "Adresse e-mail invalide" }).max(254),
  subject: z.enum(CONTACT_SUBJECTS, { error: "Sujet invalide" }),
  message: z
    .string({ error: "Le message est requis" })
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message ne peut pas dépasser 2 000 caractères"),
})

/** POST /api/contact — enregistre un message destiné à la rédaction.
 * Limité à 5 messages / 10 min / IP (anti-spam et anti-remplissage BD). */
export async function POST(request: Request) {
  try {
    const limit = rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60 * 1000)
    if (!limit.ok) return tooManyRequests(limit.retryAfterS)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Requête invalide : JSON attendu" },
        { status: 400 }
      )
    }

    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = parsed.data

    const saved = await db.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        subject,
        message: message.trim(),
      },
    })

    return NextResponse.json(
      {
        ok: true,
        id: saved.id,
        message:
          "Message bien reçu. La rédaction vous répondra sous 48 h ouvrées.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/contact", error)
    return NextResponse.json(
      { error: "Impossible d'envoyer votre message pour le moment" },
      { status: 500 }
    )
  }
}
