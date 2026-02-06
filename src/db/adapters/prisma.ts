import type { HubDbAdapter, HubDbAdapterContext, Driver } from './interface'

export const prismaAdapter: HubDbAdapter = {
  name: 'prisma',
  schemaPath: 'prisma/schema.prisma',
  requiredDeps: ['@prisma/client'],
  requiredDevDeps: ['prisma'],

  async validateSchema(ctx: HubDbAdapterContext): Promise<void> {
    const { existsSync } = await import('node:fs')
    const { join } = await import('pathe')
    const schemaPath = join(ctx.nuxt.options.rootDir, 'prisma/schema.prisma')
    if (!existsSync(schemaPath)) {
      throw new Error(`Prisma schema not found at ${schemaPath}. Run \`npx prisma init\` to create it.`)
    }
  },

  checkMissingDeps(deps: Record<string, string>, driver: Driver): string[] {
    const missing: string[] = []

    if (!deps['@prisma/client']) missing.push('@prisma/client')
    if (!deps.prisma) missing.push('prisma')

    // Prisma adapter-specific deps
    if (driver === 'd1' && !deps['@prisma/adapter-d1']) missing.push('@prisma/adapter-d1')
    if (driver === 'pglite' && !deps['@prisma/adapter-pg-lite']) missing.push('@prisma/adapter-pg-lite')
    if (driver === 'libsql') {
      if (!deps['@prisma/adapter-libsql']) missing.push('@prisma/adapter-libsql')
      if (!deps['@libsql/client']) missing.push('@libsql/client')
    }

    return missing
  },

  createClientCode(ctx: HubDbAdapterContext): string {
    const { driver, connection } = ctx.dbConfig

    if (driver === 'd1') {
      return `import pkg from '@prisma/client'
const { PrismaClient } = pkg
import { PrismaD1 } from '@prisma/adapter-d1'

let _db
function getDb() {
  if (!_db) {
    const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
    if (!binding) throw new Error('DB binding not found')
    const adapter = new PrismaD1(binding)
    _db = new PrismaClient({ adapter })
  }
  return _db
}
const db = new Proxy({}, { get(_, prop) { return getDb()[prop] } })

async function executeRaw(query) { return getDb().$executeRawUnsafe(query) }
const getRows = (result) => result || []

export { db, executeRaw, getRows }
`
    }

    if (driver === 'pglite') {
      return `import pkg from '@prisma/client'
const { PrismaClient } = pkg
import { PrismaPGlite } from '@prisma/adapter-pg-lite'
import { PGlite } from '@electric-sql/pglite'

const client = new PGlite(${JSON.stringify(connection.dataDir)})
const adapter = new PrismaPGlite(client)
const db = new PrismaClient({ adapter })

async function executeRaw(query) { return db.$executeRawUnsafe(query) }
const getRows = (result) => result || []

export { db, client, executeRaw, getRows }
`
    }

    if (driver === 'libsql') {
      return `import pkg from '@prisma/client'
const { PrismaClient } = pkg
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient(${JSON.stringify(connection)})
const adapter = new PrismaLibSQL(libsql)
const db = new PrismaClient({ adapter })

async function executeRaw(query) { return db.$executeRawUnsafe(query) }
const getRows = (result) => result || []

export { db, executeRaw, getRows }
`
    }

    // Default: use DATABASE_URL from env
    return `import pkg from '@prisma/client'
const { PrismaClient } = pkg

const db = new PrismaClient()

async function executeRaw(query) { return db.$executeRawUnsafe(query) }
const getRows = (result) => result || []

export { db, executeRaw, getRows }
`
  },

  getClientTypes(_ctx: HubDbAdapterContext): string {
    return `import { PrismaClient } from '@prisma/client'

declare module 'hub:db' {
  /**
   * The Prisma database client.
   */
  export const db: PrismaClient
  /** Execute raw SQL for migrations */
  export function executeRaw(query: string): Promise<unknown>
  /** Extract rows from query result */
  export function getRows(result: unknown): unknown[]
}`
  },

  async onPrepareTypes(ctx: HubDbAdapterContext): Promise<void> {
    const { execa } = await import('execa')
    const { logger } = await import('@nuxt/kit')
    const log = logger.withTag('nuxt:hub')

    log.info('Generating Prisma client...')
    try {
      await execa('npx', ['prisma', 'generate'], {
        cwd: ctx.nuxt.options.rootDir,
        stdio: 'inherit'
      })
    } catch (error) {
      log.error('Failed to generate Prisma client:', error)
      throw error
    }
  }
}
