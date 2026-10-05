import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Clés de SiteSetting exposées par cette route PUBLIQUE. Toute autre clé
 * (paramètre interne, future donnée sensible…) reste invisible hors cockpit.
 */
const PUBLIC_SETTING_KEYS = new Set([
  "siteName",
  "tagline",
  "footerNote",
  "aboutLead",
  // FM/TV : interrupteurs cockpit + flux publics (audio radio / vidéo TV).
  "fmEnabled",
  "fmLabel",
  "fmStreamUrl",
  "tvEnabled",
  "tvLabel",
  "tvStreamUrl",
])

/**
 * GET /api/settings — configuration publique du site.
 * Retourne les paramètres généraux autorisés, l'annuaire de contact et les
 * réseaux sociaux visibles (tous modifiables depuis le cockpit rédaction).
 */
export async function GET() {
  try {
    const [settingRows, channelRows, socialRows] = await Promise.all([
      db.siteSetting.findMany(),
      db.contactChannel.findMany({
        where: { visible: true },
        orderBy: [{ order: "asc" }],
      }),
      db.socialLink.findMany({
        where: { visible: true },
        orderBy: [{ order: "asc" }],
      }),
    ])

    const settings: Record<string, string> = {}
    for (const row of settingRows) {
      if (PUBLIC_SETTING_KEYS.has(row.key)) settings[row.key] = row.value
    }

    return NextResponse.json({
      settings,
      channels: channelRows.map((channel) => ({
        id: channel.id,
        type: channel.type,
        label: channel.label,
        value: channel.value,
        order: channel.order,
        visible: channel.visible,
      })),
      socials: socialRows.map((social) => ({
        id: social.id,
        platform: social.platform,
        url: social.url,
        order: social.order,
        visible: social.visible,
      })),
    })
  } catch (error) {
    console.error("GET /api/settings", error)
    return NextResponse.json(
      { error: "Impossible de charger les paramètres du site" },
      { status: 500 }
    )
  }
}
