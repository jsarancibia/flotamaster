import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function resolveDatabaseUrl() {
  return (
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  )
}

function createPrismaClient() {
  const url = resolveDatabaseUrl()
  if (!url) return null

  return new PrismaClient({
    datasources: {
      db: { url }
    }
  })
}

function createMissingEnvProxy(): PrismaClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Falta la variable de entorno para la base de datos. Configura POSTGRES_PRISMA_URL o DATABASE_URL en Vercel.'
        )
      }
    }
  ) as unknown as PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient() ??
  createMissingEnvProxy()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
