import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Réessaie une fois après un réveil de la base (Neon scale-to-zero). */
function withColdStartRetry() {
  return Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allOperations: async ({ query, args }) => {
          try {
            return await query(args)
          } catch (error) {
            const code = (error as { code?: string }).code ?? ""
            const retryable = code === "P1001" || code === "P1002" || code === "P2024"
            if (!retryable) throw error
            await new Promise((resolve) => setTimeout(resolve, 2500))
            return await query(args)
          }
        },
      },
    })
  )
}

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // En production : erreurs et avertissements seulement. Les requêtes ne
    // sont tracées qu'en développement (bruit et données sensibles évités).
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
    })

const extended = baseClient.$extends(withColdStartRetry())

// Le cast préserve le typage complet du client (groupBy & co.) tout en
// gardant la reprise automatique sur réveil de la base.
export const db = extended as unknown as typeof baseClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = baseClient
