// Attache les images aux articles et catégories (idempotent, rejouable).
//
// Articles   : /uploads/<slug>.jpg — fichiers locaux déjà commités dans
//              public/uploads (servis par Next/Vercel sans dépendance externe).
// Catégories : images de prisma/images.json (URL z-cdn) — stockées telles
//              quelles, le rendu a un repli dégradé si l'URL meurt.
//
// Exécution : bun scripts/attach-images.ts
import { existsSync, readFileSync } from "fs"
import { join } from "path"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const KEY_TO_SLUG: Record<string, string> = {
  // catégories
  "cat-sciences": "sciences",
  "cat-histoire": "histoire",
  "cat-technologie": "technologie",
  "cat-sante": "sante",
  "cat-culture": "culture",
  "cat-societe": "societe",
  "cat-economie": "economie",
  "cat-nature": "nature",
  // articles
  "a-sky-blue": "pourquoi-le-ciel-est-bleu",
  "a-black-holes": "trous-noirs-expliques",
  "a-crispr": "crispr-revolution-genetique",
  "a-rome": "chute-empire-romain",
  "a-curie": "marie-curie-pionniere",
  "a-megaliths": "megalithes-pyramides-construction",
  "a-genai": "ia-generative-fonctionnement",
  "a-internet": "histoire-internet-arpanet-web",
  "a-quantum": "informatique-quantique-revolution",
  "a-sleep": "sommeil-profond-cerveau",
  "a-fasting": "jeune-intermittent-science",
  "a-microbiote": "microbiote-second-cerveau",
  "a-monalisa": "joconde-fascination",
  "a-beethoven": "beethoven-genie-silence",
  "a-myths": "mythes-grecs-heritage",
  "a-lie": "pourquoi-mentons-nous",
  "a-pygmalion": "effet-pygmalion-attentes",
  "a-cities": "villes-futur-urbanisme-climat",
  "a-inflation": "inflation-expliquee",
  "a-banques": "taux-directeur-banque-centrale",
  "a-attention": "economie-attention",
  "a-amazon": "amazonie-poumon-fragile",
  "a-bees": "disparition-abeilles-consequences",
  "a-oceans": "oceans-eponges-climat",
}

async function main() {
  // Correspondance clé → URL d'origine (utile pour les rubriques).
  const mapping = JSON.parse(
    readFileSync(join(process.cwd(), "prisma", "images.json"), "utf8")
  ) as Record<string, string>

  let categories = 0
  let articles = 0

  for (const [key, url] of Object.entries(mapping)) {
    const slug = KEY_TO_SLUG[key]
    if (!slug) {
      console.warn(`⚠ clé inconnue : ${key}`)
      continue
    }

    if (key.startsWith("cat-")) {
      // Rubrique : URL d'origine (le composant a un repli dégradé si absente).
      const res = await prisma.category.updateMany({
        where: { slug },
        data: { image: url },
      })
      categories += res.count
    } else {
      // Article : fichier local prioritaire, URL d'origine en repli.
      const local = `/uploads/${slug}.jpg`
      const cover = existsSync(join(process.cwd(), "public", "uploads", `${slug}.jpg`))
        ? local
        : url
      const res = await prisma.article.updateMany({
        where: { slug },
        data: { coverImage: cover },
      })
      articles += res.count
    }
  }

  console.log(`✅ Images attachées : ${categories} catégories, ${articles} articles`)
}

main()
  .catch((e) => {
    console.error("❌", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
