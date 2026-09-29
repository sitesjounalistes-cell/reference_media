import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/** GET /api/facts/random — une anecdote au hasard. */
export async function GET() {
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

    return NextResponse.json({
      fact: fact ? { id: fact.id, content: fact.content, source: fact.source } : null,
    })
  } catch (error) {
    console.error("GET /api/facts/random", error)
    return NextResponse.json(
      { error: "Impossible de charger l'anecdote" },
      { status: 500 }
    )
  }
}
