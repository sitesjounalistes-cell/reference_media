import { NextResponse } from "next/server"

import { ADMIN_COOKIE, isAdminConfigured, verifySessionToken } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

/** GET /api/admin/session — sonde d'état : le cockpit est-il déverrouillé ? */
export async function GET(request: Request) {
  const header = request.headers.get("cookie") ?? ""
  const token = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1)

  return NextResponse.json({
    authenticated: verifySessionToken(token),
    configured: isAdminConfigured(),
  })
}
