// BRANCHAGE EN BASE des photos éditoriales téléchargées (task 9-e).
// - lit scripts/_img9e/mapping.json { slug -> { file, bytes, width, height, ... } }
// - Article.coverImage = /uploads/<slug>.<ext>  (champ EXACT du schéma : coverImage ; pas de champ imageAlt dans le modèle Article)
// - upsert MediaAsset (médiathèque cockpit) pour chaque fichier installé
// - ne touche à aucun autre champ ; AdCampaign intact
import { readFileSync, statSync } from "fs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type Entry = { file: string; url: string; caption: string; source: string; bytes: number; width: number; height: number }

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

async function main() {
  const mapping = JSON.parse(
    readFileSync("/home/z/my-project/scripts/_img9e/mapping.json", "utf8")
  ) as Record<string, Entry>

  let articles = 0
  let medias = 0
  const misses: string[] = []

  for (const [slug, entry] of Object.entries(mapping)) {
    const disk = `/home/z/my-project/public/uploads/${entry.file}`
    let size = entry.bytes
    try {
      size = statSync(disk).size
    } catch {
      misses.push(slug)
      console.error(`!! ${slug} : fichier absent du disque (${disk})`)
      continue
    }
    const ext = entry.file.split(".").pop() || "jpg"

    const res = await prisma.article.updateMany({
      where: { slug },
      data: { coverImage: `/uploads/${entry.file}` },
    })
    if (res.count === 0) {
      misses.push(slug)
      console.error(`!! ${slug} : article introuvable en base`)
      continue
    }
    articles += res.count

    await prisma.mediaAsset.upsert({
      where: { filename: entry.file },
      update: { size, mimeType: MIME[ext] ?? "image/jpeg" },
      create: {
        filename: entry.file,
        originalName: `${slug}.${ext}`,
        mimeType: MIME[ext] ?? "image/jpeg",
        size,
        kind: "IMAGE",
      },
    })
    medias++
  }

  console.log(`✅ coverImage mises à jour : ${articles} articles ; MediaAsset upserts : ${medias}`)
  if (misses.length) console.log(`⚠ Anomalies : ${misses.join(", ")}`)

  // Contrôle final : les 24 publiés ont une couverture locale
  const withoutCover = await prisma.article.count({
    where: { status: "PUBLISHED", OR: [{ coverImage: null }, { coverImage: "" }] },
  })
  const remote = await prisma.article.count({
    where: { status: "PUBLISHED", coverImage: { startsWith: "http" } },
  })
  console.log(`Contrôle : publiés sans couverture = ${withoutCover} ; couvertures distantes restantes = ${remote}`)
}

main()
  .catch((e) => {
    console.error("❌", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
