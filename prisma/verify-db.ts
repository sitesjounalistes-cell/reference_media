/** Vérification du contenu de la base Neon (avec reprise pour réveil compute). */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const [articles, categories, authors, campaigns, events, subscribers, messages, settings] =
    await Promise.all([
      db.article.count(),
      db.category.count(),
      db.author.count(),
      db.adCampaign.count(),
      db.adEvent.count(),
      db.newsletterSubscriber.count(),
      db.contactMessage.count(),
      db.siteSetting.count(),
    ])
  console.log(
    `articles=${articles} rubriques=${categories} auteurs=${authors} campagnes=${campaigns} ` +
      `evenements=${events} abonnes=${subscribers} messages=${messages} parametres=${settings}`
  )
}

let attempt = 0
try {
  while (true) {
    try {
      await main()
      break
    } catch (error) {
      attempt++
      if (attempt >= 5) {
        console.error("Échec après 5 tentatives :", error instanceof Error ? error.message : error)
        process.exit(1)
      }
      console.log(`Base en cours de réveil (Neon), nouvelle tentative ${attempt}/5 dans 8 s…`)
      await new Promise((r) => setTimeout(r, 8000))
    }
  }
} finally {
  await db.$disconnect()
}
