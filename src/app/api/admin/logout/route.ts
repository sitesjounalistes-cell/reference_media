import { NextResponse } from "next/server"

import { ADMIN_COOKIE, assertSameOrigin, clearedCookieOptions } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

/** POST /api/admin/logout — ferme la session cockpit (efface le cookie). */
export async function POST(request: Request) {
  try {
    const originDenied = assertSameOrigin(request)
    if (originDenied) return originDenied

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_COOKIE, "", clearedCookieOptions())
    return response
  } catch (error) {
    console.error("POST /api/admin/logout", error)
    return NextResponse.json(
      { error: "Impossible de se déconnecter" },
      { status: 500 }
    )
  }
}
