import { mkdir } from 'node:fs/promises'
import { join } from 'pathe'
import { addServerImportsDir, addServerScanDir, addTemplate, addTypeTemplate, logger } from '@nuxt/kit'
import { provider } from 'std-env'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from '../runtime/database/server/utils/migrations/helpers'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { Nitro } from 'nitropack'
import type { HubConfig, ResolvedDatabaseConfig } from '../features'
import type { ModuleOptions, DatabaseConfig } from '../types/module'

const log = logger.withTag('nuxt:hub')

/**
 * Resolve database configuration from string or object format
 */
export async function resolveDatabaseConfig(nuxt: Nuxt, hub: HubConfig, hosting: string): Promise<ResolvedDatabaseConfig> {
  const database = ((nuxt.options as any).hub as ModuleOptions).database
  let dialect: 'sqlite' | 'postgresql' | 'mysql'
  let connection: Record<string, any> = {}
  let driver: string | undefined

  // If it's a string, parse it and auto-detect connection
  if (typeof database === 'string') {
    dialect = database as 'sqlite' | 'postgresql' | 'mysql'

    // Auto-detect connection based on environment variables
    if (dialect === 'sqlite') {
      // Tursor Cloud
      if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        connection = {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN
        }
      }
      // Cloudflare D1
      else if (hosting.includes('cloudflare')) {
        driver = 'd1'
        nuxt.options.nitro.cloudflare ||= {}
        nuxt.options.nitro.cloudflare.deployConfig = true
        nuxt.options.nitro.cloudflare.wrangler ||= {}
        nuxt.options.nitro.cloudflare.wrangler.d1_databases ||= []

        let dbBinding = nuxt.options.nitro.cloudflare.wrangler.d1_databases!.find(db => db?.binding === 'DB')
        if (!dbBinding) {
          dbBinding = { binding: 'DB' }
          nuxt.options.nitro.cloudflare.wrangler.d1_databases.push(dbBinding as any)
        }

        dbBinding.migrations_table ||= '_hub_migrations'
        dbBinding.migrations_dir ||= 'migrations'
      }
      // Local SQLite
      else {
        connection = { url: `file:${join(hub.dir!, 'database/sqlite.db')}` }
        await mkdir(join(hub.dir!, 'database/sqlite'), { recursive: true })
      }
    }
    else if (dialect === 'postgresql') {
      const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL
      driver = 'node-postgres'
      if (url) {
        connection = { connectionString: url }
      }
      else {
        driver = 'pglite'
        connection = { dataDir: join(hub.dir!, 'database/pglite') }
        await mkdir(join(hub.dir!, 'database/pglite'), { recursive: true })
      }
    }
    else if (dialect === 'mysql') {
      connection = { url: process.env.DATABASE_URL || process.env.MYSQL_URL }
      if (!connection.url) {
        throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable')
      }
    }
  } else {
    // It's a DatabaseConfig object
    dialect = (database as DatabaseConfig).dialect
    connection = (database as DatabaseConfig).connection || {}
    driver = (database as DatabaseConfig).driver
  }

  // Auto-detect driver if not explicitly provided
  if (!driver) {
    if (dialect === 'sqlite') {
      driver = 'libsql'
    } else if (dialect === 'postgresql') {
      driver = 'node-postgres'
    } else {
      driver = 'mysql2'
    }
  }

  return { dialect, driver, connection }
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  const hosting = process.env.NITRO_PRESET || nuxt.options.nitro.preset || provider
  hub.database = await resolveDatabaseConfig(nuxt, hub, hosting)

  const { dialect, driver, connection } = hub.database as ResolvedDatabaseConfig

  logWhenReady(nuxt, `\`drizzle()\` using \`${dialect}\` database with \`${driver}\` driver`, 'info')

  // Verify development database dependencies are installed
  if (driver === 'node-postgres' && !deps.pg) {
    logWhenReady(nuxt, 'Please run `npx nypm i pg` to use PostgreSQL as database.', 'error')
  } else if (driver === 'pglite' && !deps['@electric-sql/pglite']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @electric-sql/pglite` to use PGlite as database.', 'error')
  } else if (driver === 'mysql2' && !deps.mysql2) {
    logWhenReady(nuxt, 'Please run `npx nypm i mysql2` to use MySQL as database.', 'error')
  } else if (driver === 'libsql' && !deps['@libsql/client']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @libsql/client` to use SQLite as database.', 'error')
  }

  // Add Server scanning
  addServerScanDir(resolve('runtime/database/server'))
  addServerImportsDir(resolve('runtime/database/server/utils'))

  // Handle migrations
  nuxt.hook('modules:done', async () => {
    // Call hub:database:migrations:dirs hook
    await nuxt.callHook('hub:database:migrations:dirs', hub.databaseMigrationsDirs!)
    // Copy all migrations files to the hub.dir directory
    await copyDatabaseMigrationsToHubDir(hub)
    // Call hub:database:queries:paths hook
    await nuxt.callHook('hub:database:queries:paths', hub.databaseQueriesPaths!)
    await copyDatabaseQueriesToHubDir(hub)
  })

  // Setup Drizzle ORM
  const drizzleOrmTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driver}'

declare module 'hub:database' {
  export function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(options?: DrizzleConfig<TSchema>): ReturnType<typeof drizzleCore<TSchema>>
}`

  // Generate simplified drizzle() implementation
  let drizzleOrmContent = `import { drizzle as drizzleClient } from 'drizzle-orm/${driver}'

let _drizzle = null
export function drizzle(options) {
  if (!_drizzle) {
    _drizzle = drizzleClient({ connection: ${JSON.stringify(connection)}, ...options })
  }
  return _drizzle
}`

  if (driver === 'd1') {
    // D1 requires binding from environment
    drizzleOrmContent = `import { drizzle as drizzleClient } from 'drizzle-orm/d1'
// import { env } from 'cloudflare:workers'

let _drizzle = null
export function drizzle(options) {
  // if (!env.DB) throw new Error('Cannot find the D1 database attached to DB binding')
  if (!_drizzle) {
    // _drizzle = drizzleClient(env.DB, options)
    const binding = process.env.DB || globalThis.DB
    if (!binding) throw new Error('Cannot find the D1 database attached to DB binding')
    _drizzle = drizzleClient(binding, options)
  }
  return _drizzle
}`
  }
  if (['node-postgres', 'mysql2'].includes(driver) && hosting.includes('cloudflare')) {
    drizzleOrmContent = `import { drizzle as drizzleClient } from 'drizzle-orm/${driver}'

let _drizzle = null
export function drizzle(options) {
  if (!_drizzle) {
    const hyperdrive = process.env.POSTGRES || globalThis.__env__?.POSTGRES || globalThis.POSTGRES
    if (!hyperdrive?.connectionString) throw new Error('Cannot find the Hyperdrive database attached to DB binding')
    _drizzle = drizzleClient({ connection: hyperdrive.connectionString, ...options })
  }
  return _drizzle
}`
  }

  const template = addTemplate({
    filename: 'hub/database.mjs',
    getContents: () => drizzleOrmContent,
    write: true
  })
  nuxt.options.nitro.alias!['hub:database'] = template.dst
  addTypeTemplate({
    filename: 'hub/database.d.ts',
    getContents: () => drizzleOrmTypes
  }, { nitro: true })
}
