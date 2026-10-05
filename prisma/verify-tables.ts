/** Vérification de la table ArticleTranslation sur Neon. */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const count = await db.articleTranslation.count()
  console.log(`ArticleTranslation OK (${count} lignes)`)
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
        console.error("Échec :", error instanceof Error ? error.message : error)
        process.exit(1)
      }
      console.log(`Réveil Neon, tentative ${attempt}/5 dans 8 s…`)
      await new Promise((r) => setTimeout(r, 8000))
    }
  }
} finally {
  await db.$disconnect()
}
