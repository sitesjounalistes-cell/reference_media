import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, author: true },
    orderBy: { publishedAt: "asc" },
  })
  for (const a of articles) {
    console.log(
      JSON.stringify({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        category: a.category.name,
        categorySlug: a.category.slug,
        coverImage: a.coverImage,
        featured: a.featured,
        tags: a.tags,
      })
    )
  }
  console.error(`TOTAL: ${articles.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
