/**
 * Seed cockpit — données initiales de l'espace rédaction (idempotent).
 *   bun prisma/seed-cockpit.ts
 * - Paramètres du site (nom, signature, mention légale)
 * - Annuaire de contact (téléphones, emails, adresse, horaires)
 * - Réseaux sociaux
 * - Distribution des nouveaux emplacements publicitaires (top, rails, bottom)
 *   sur les campagnes maison existantes.
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const SETTINGS: Record<string, string> = {
  siteName: "REFERENCE.COM",
  tagline: "Le portail de référence francophone",
  footerNote: "REFERENCE.COM — Un media indépendant, des journalistes exigeants.",
  aboutLead:
    "Depuis 2019, REFERENCE.COM explique le monde avec rigueur et précision. Chaque article est vérifié, sourcé et signé par la rédaction.",
}

const CHANNELS: Array<{ type: string; label: string; value: string; order: number }> = [
  { type: "PHONE", label: "Rédaction", value: "+33 1 84 80 20 24", order: 1 },
  { type: "PHONE", label: "Publicité", value: "+33 1 84 80 20 30", order: 2 },
  { type: "EMAIL", label: "Rédaction", value: "redaction@reference.com", order: 3 },
  { type: "EMAIL", label: "Publicité", value: "publicite@reference.com", order: 4 },
  { type: "ADDRESS", label: "Siège", value: "12 rue de la Presse, 75002 Paris", order: 5 },
  { type: "HOURS", label: "Horaires", value: "Lun – Ven, 9h – 19h", order: 6 },
]

const SOCIALS: Array<{ platform: string; url: string; order: number }> = [
  { platform: "x", url: "https://x.com/referencecom", order: 1 },
  { platform: "facebook", url: "https://facebook.com/referencecom", order: 2 },
  { platform: "instagram", url: "https://instagram.com/referencecom", order: 3 },
  { platform: "youtube", url: "https://youtube.com/@referencecom", order: 4 },
  { platform: "linkedin", url: "https://linkedin.com/company/referencecom", order: 5 },
]

/** Nouveaux emplacements site → campagnes maison (l'inventaire libre prend le relais). */
const SLOT_DISTRIBUTION: Record<string, string[]> = {
  top: ["lettre", "regie"],
  "rail-left": ["sciences", "histoire"],
  "rail-right": ["quipe", "lettre"],
  bottom: ["regie", "histoire"],
}

async function main() {
  // 1. Paramètres du site
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    })
  }
  console.log(`Settings : ${Object.keys(SETTINGS).length} clés assurées`)

  // 2. Annuaire de contact
  const channelCount = await db.contactChannel.count()
  if (channelCount === 0) {
    await db.contactChannel.createMany({ data: CHANNELS })
    console.log(`ContactChannel : ${CHANNELS.length} entrées créées`)
  } else {
    console.log(`ContactChannel : ${channelCount} entrées déjà présentes`)
  }

  // 3. Réseaux sociaux
  const socialCount = await db.socialLink.count()
  if (socialCount === 0) {
    await db.socialLink.createMany({ data: SOCIALS })
    console.log(`SocialLink : ${SOCIALS.length} entrées créées`)
  } else {
    console.log(`SocialLink : ${socialCount} entrées déjà présentes`)
  }

  // 4. Étendre les campagnes existantes aux nouveaux emplacements
  const campaigns = await db.adCampaign.findMany()
  let updated = 0
  for (const campaign of campaigns) {
    const current = campaign.slots.split(",").map((s) => s.trim()).filter(Boolean)
    const wanted = new Set(current)
    for (const [slot, keywords] of Object.entries(SLOT_DISTRIBUTION)) {
      const matches = keywords.some((k) => campaign.name.toLowerCase().includes(k))
      if (matches) wanted.add(slot)
    }
    // La campagne régie (« Votre marque ici » + contact pub) couvre tout le site.
    if (campaign.ctaView.startsWith("contact:publicite")) {
      wanted.add("top")
      wanted.add("bottom")
      wanted.add("rail-left")
      wanted.add("rail-right")
    }
    const next = Array.from(wanted).join(",")
    if (next !== campaign.slots) {
      await db.adCampaign.update({ where: { id: campaign.id }, data: { slots: next } })
      updated++
    }
  }
  console.log(`AdCampaign : ${updated} campagne(s) étendue(s) aux nouveaux emplacements`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
