// Script temporaire : liste les articles publiés (id/slug/titre/catégorie/coverImage)
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      status: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { publishedAt: "desc" },
  })
  console.log(JSON.stringify({ total: articles.length, articles }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
