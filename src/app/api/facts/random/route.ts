import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { langParam } from "@/lib/reference-api"
import { translateLabels } from "@/lib/translate"

export const dynamic = "force-dynamic"

/** GET /api/facts/random — une anecdote au hasard. ?lang= traduit le contenu. */
export async function GET(request: Request) {
  try {
    const total = await db.funFact.count()
    if (total === 0) {
      return NextResponse.json(
        { error: "Aucune anecdote disponible" },
        { status: 404 }
      )
    }

    const fact = await db.funFact.findFirst({
      skip: Math.floor(Math.random() * total),
      orderBy: { id: "asc" },
    })

    const lang = langParam(request)
    let content = fact?.content ?? ""
    let source = fact?.source ?? null
    if (fact && lang !== "fr") {
      const labels = await translateLabels(
        [fact.content, ...(fact.source ? [fact.source] : [])],
        lang
      )
      content = labels.get(fact.content) ?? content
      source = fact.source ? labels.get(fact.source) ?? source : source
    }

    return NextResponse.json({
      fact: fact ? { id: fact.id, content, source } : null,
    })
  } catch (error) {
    console.error("GET /api/facts/random", error)
    return NextResponse.json(
      { error: "Impossible de charger l'anecdote" },
      { status: 500 }
    )
  }
}
