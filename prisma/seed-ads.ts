/**
 * Seed régie publicitaire REFERENCE.COM
 * - 5 campagnes maison (newsletter, rubriques, régie, équipe)
 * - 14 jours d'événements (impressions + clics) pour alimenter le tableau de bord
 * - Quelques abonnés newsletter et messages de contact si les tables sont vides
 *
 * Exécution : bun prisma/seed-ads.ts
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

/* ------------------------------ Déterminisme ------------------------------ */

/** PRNG mulberry32 — reproductible d'une exécution à l'autre. */
function makeRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = makeRandom(20250114)

/* -------------------------------- Campagnes ------------------------------- */

const CAMPAIGNS = [
  {
    name: "Lettre hebdomadaire",
    advertiser: "La rédaction — REFERENCE.COM",
    headline: "Le monde décrypté, chaque dimanche",
    body: "Une sélection de dossiers rigoureux, clairs et sourcés, livrée dans votre boîte mail. Gratuit, sans spam, désinscription en un clic.",
    ctaLabel: "S'abonner à la lettre",
    ctaView: "home",
    color: "#1B5FD9",
    slots: "leaderboard,billboard",
    weight: 2,
  },
  {
    name: "Dossiers Sciences",
    advertiser: "Rubrique Sciences",
    headline: "CRISPR, quantique, IA : la science enfin lisible",
    body: "Nos dossiers sont vulgarisés par des journalistes spécialisés, vérifiés et sans jargon inutile.",
    ctaLabel: "Explorer la rubrique",
    ctaView: "category:sciences",
    color: "#0D9488",
    slots: "leaderboard,inline,sidebar",
    weight: 2,
  },
  {
    name: "Grande Histoire",
    advertiser: "Rubrique Histoire",
    headline: "De Rome à Beethoven : six mille ans d'histoires vraies",
    body: "Des récits sourcés, racontés par des historiens de métier. L'Histoire n'aura jamais été aussi vivante.",
    ctaLabel: "Voyager dans le temps",
    ctaView: "category:histoire",
    color: "#B45309",
    slots: "sidebar,inline",
    weight: 1,
  },
  {
    name: "Régie publicitaire",
    advertiser: "Régie REFERENCE.COM",
    headline: "Votre marque face à 120 000 lecteurs curieux",
    body: "Bannières premium, habillages et contenus sponsorisés. Audience qualifiée, formats sur mesure, équipes à votre écoute.",
    ctaLabel: "Demander le tarif média",
    ctaView: "contact:publicite",
    color: "#E8192C",
    slots: "leaderboard,sidebar,inline,billboard",
    weight: 2,
  },
  {
    name: "L'équipe de la rédaction",
    advertiser: "La rédaction — REFERENCE.COM",
    headline: "Six journalistes, une exigence : la rigueur",
    body: "Découvrez l'équipe, la charte éditoriale et notre méthode de travail. Sans langue de bois.",
    ctaLabel: "Rencontrer l'équipe",
    ctaView: "about",
    color: "#65A30D",
    slots: "billboard,leaderboard",
    weight: 1,
  },
  {
    name: "Nexalis — Prêt immobilier",
    advertiser: "Nexalis Banque",
    headline: "Votre projet immobilier mérite le meilleur taux",
    body: "Prêt à taux fixe dès 3,15 % sur 20 ans. Réponse de principe en 48 h, frais de dossier offerts jusqu'au 31 mars. Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.",
    ctaLabel: "Simuler mon prêt",
    ctaView: "home",
    color: "#0A2A5E",
    imageUrl: "/uploads/ads/nexalis.png",
    slots: "top,billboard,leaderboard",
    weight: 3,
  },
  {
    name: "Voltia — SUV e-Traverse",
    advertiser: "Voltia Automobile",
    headline: "L'électrique qui va loin. Très loin.",
    body: "Nouveau SUV Voltia e-Traverse : 520 km d'autonomie WLTP, charge 10 → 80 % en 26 minutes. À partir de 34 900 €, bonus écologique déduit. Essai offert dans votre concession.",
    ctaLabel: "Configurer le mien",
    ctaView: "home",
    color: "#C8102C",
    imageUrl: "/uploads/ads/voltia.png",
    slots: "billboard,leaderboard,bottom",
    weight: 3,
  },
  {
    name: "Orbitel — Fibre 8 Gbit/s",
    advertiser: "Orbitel Télécom",
    headline: "La fibre 8 Gbit/s arrive dans votre quartier",
    body: "Box internet + mobile dès 29,99 €/mois pendant 12 mois. Installation offerte, sans engagement, satellite et Wi-Fi 7 inclus.",
    ctaLabel: "Vérifier mon adresse",
    ctaView: "home",
    color: "#E85D00",
    imageUrl: "/uploads/ads/orbitel.png",
    slots: "top,sidebar,inline",
    weight: 2,
  },
  {
    name: "Horizéon — Voilier Baléares",
    advertiser: "Horizéon Voyages",
    headline: "Baléares : 7 nuits en voilier dès 499 €",
    body: "Cabine privée, skipper professionnel, escales secrètes entre Majorque et Cabrera. Départs chaque samedi, de mai à septembre.",
    ctaLabel: "Découvrir les escales",
    ctaView: "home",
    color: "#00857A",
    imageUrl: "/uploads/ads/horizeon.png",
    slots: "rail-left,rail-right,sidebar",
    weight: 2,
  },
  {
    name: "Clématis — Habitation",
    advertiser: "Clématis Assurances",
    headline: "Protégez votre maison, pas votre budget",
    body: "Assurance habitation tous risques : −30 % la première année, résiliation à tout moment, expert chez vous sous 24 h en cas de sinistre.",
    ctaLabel: "Obtenir mon devis",
    ctaView: "home",
    color: "#1E6B4F",
    imageUrl: "/uploads/ads/clematys.png",
    slots: "sidebar,inline,bottom",
    weight: 2,
  },
  {
    name: "MarchéPlus — Semaine fraîcheur",
    advertiser: "MarchéPlus",
    headline: "Les produits frais, à prix juste",
    body: "Tomates grappe 1,99 €/kg, cagette de saison 3,90 €. Producteurs locaux, arrivages chaque matin dans vos 240 magasins.",
    ctaLabel: "Trouver mon magasin",
    ctaView: "home",
    color: "#B7791F",
    imageUrl: "/uploads/ads/marcheplus.png",
    slots: "bottom,leaderboard,rail-right,inline",
    weight: 2,
  },
] as const

/* ------------------------- Événements (14 jours) -------------------------- */

const DAYS = 14
/** Taux de clic de base par campagne (indices de CAMPAIGNS). */
const BASE_CTR = [0.021, 0.028, 0.019, 0.034, 0.016]
/** Impressions moyennes journalières par campagne. */
const BASE_IMPRESSIONS = [310, 260, 180, 340, 150]

async function seedEvents(campaignIds: string[]) {
  const events: Array<{
    campaignId: string
    slot: string
    type: string
    createdAt: Date
  }> = []

  const now = new Date()

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date(now)
    day.setDate(now.getDate() - d)
    day.setHours(0, 0, 0, 0)
    const weekday = day.getDay() // 0 dimanche … 6 samedi
    // Audience plus forte en semaine, creux le week-end.
    const dayFactor = weekday === 0 || weekday === 6 ? 0.62 : 1
    // Tendance légèrement croissante vers aujourd'hui.
    const trend = 0.8 + 0.2 * ((DAYS - 1 - d) / (DAYS - 1))

    campaignIds.forEach((campaignId, index) => {
      const impressions = Math.round(
        BASE_IMPRESSIONS[index] * dayFactor * trend * (0.82 + rand() * 0.36)
      )
      const clicks = Math.max(
        1,
        Math.round(impressions * BASE_CTR[index] * (0.75 + rand() * 0.5))
      )

      for (let i = 0; i < impressions; i++) {
        const createdAt = new Date(day)
        createdAt.setHours(
          Math.floor(rand() * 15) + 7, // 7 h – 21 h
          Math.floor(rand() * 60),
          Math.floor(rand() * 60)
        )
        events.push({ campaignId, slot: "leaderboard", type: "impression", createdAt })
      }
      for (let i = 0; i < clicks; i++) {
        const createdAt = new Date(day)
        createdAt.setHours(
          Math.floor(rand() * 15) + 7,
          Math.floor(rand() * 60),
          Math.floor(rand() * 60)
        )
        events.push({ campaignId, slot: "leaderboard", type: "click", createdAt })
      }
    })
  }

  // Insertion par lots (SQLite limite les requêtes paramétrées à 999 variables).
  const CHUNK = 800
  for (let i = 0; i < events.length; i += CHUNK) {
    await db.adEvent.createMany({ data: events.slice(i, i + CHUNK) })
  }
  return events.length
}

/* ------------------------------- Compléments ------------------------------ */

async function seedSubscribersIfEmpty() {
  const count = await db.newsletterSubscriber.count()
  if (count >= 4) return 0
  const emails = [
    "camille.robert@exemple.fr",
    "hugo.martin@exemple.fr",
    "lea.bernard@exemple.fr",
    "noah.dubois@exemple.fr",
    "emma.petit@exemple.fr",
    "louis.moreau@exemple.fr",
  ]
  const data = emails.map((email, i) => {
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - (12 - i))
    createdAt.setHours(9 + (i % 8), Math.floor(rand() * 60))
    return { email, createdAt }
  })
  // SQLite ne supporte pas skipDuplicates : on filtre les e-mails déjà présents.
  const existing = new Set(
    (await db.newsletterSubscriber.findMany({ select: { email: true } })).map(
      (s) => s.email
    )
  )
  const fresh = data.filter((d) => !existing.has(d.email))
  if (fresh.length > 0) await db.newsletterSubscriber.createMany({ data: fresh })
  return fresh.length
}

async function seedMessagesIfEmpty() {
  const count = await db.contactMessage.count()
  if (count >= 1) return 0
  const messages = [
    {
      name: "Nathalie Perrot",
      email: "nathalie.perrot@exemple.fr",
      subject: "correction",
      message:
        "Bonjour, dans le dossier sur les abeilles, la population citée me semble datée de 2022. Pouvez-vous vérifier ? Merci pour ce travail remarquable.",
    },
    {
      name: "Karim Bensaïd",
      email: "karim.bensaid@exemple.fr",
      subject: "publicite",
      message:
        "Bonjour, je représente une maison d'édition scientifique et je souhaite diffuser une campagne sur votre rubrique Sciences. Pouvez-vous m'envoyer votre tarif média ?",
    },
    {
      name: "Élodie Faure",
      email: "elodie.faure@exemple.fr",
      subject: "partenariat",
      message:
        "Nous organisons un festival de vulgarisation en octobre et aimerions vous proposer un partenariat éditorial.",
    },
    {
      name: "Guillaume Tessier",
      email: "g.tessier@exemple.fr",
      subject: "redaction",
      message:
        "Votre dossier sur l'inflation est très clair. Auriez-vous prévu un article sur les taux directeurs de la BCE ?",
    },
  ]
  const data = messages.map((m, i) => {
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - (6 - i * 2))
    createdAt.setHours(10 + (i % 6), Math.floor(rand() * 60))
    return { ...m, createdAt }
  })
  await db.contactMessage.createMany({ data })
  return data.length
}

/* ---------------------------------- Main ---------------------------------- */

async function main() {
  console.log("→ Régie : suppression des données publicitaires existantes…")
  await db.adEvent.deleteMany()
  await db.adCampaign.deleteMany()

  console.log("→ Création des campagnes…")
  const campaignIds: string[] = []
  for (const campaign of CAMPAIGNS) {
    const created = await db.adCampaign.create({ data: { ...campaign } })
    campaignIds.push(created.id)
    console.log(`   • ${created.name} (${created.slots})`)
  }

  console.log("→ Génération de 14 jours d'événements…")
  const total = await seedEvents(campaignIds)
  console.log(`   ${total.toLocaleString("fr-FR")} événements insérés.`)

  const subscribers = await seedSubscribersIfEmpty()
  if (subscribers > 0) console.log(`→ ${subscribers} abonnés newsletter ajoutés.`)

  const messages = await seedMessagesIfEmpty()
  if (messages > 0) console.log(`→ ${messages} messages de contact ajoutés.`)

  console.log("✔ Seed régie publicitaire terminé.")
}

main()
  .catch((error) => {
    console.error("✘ Échec du seed régie :", error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
