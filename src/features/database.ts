import { mkdir } from 'node:fs/promises'
import { join } from 'pathe'
import { defu } from 'defu'
import { addServerImportsDir, addServerScanDir, addTemplate, addTypeTemplate } from '@nuxt/kit'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from '../runtime/database/server/utils/migrations/helpers'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { ResolvedDatabaseConfig, HubConfig } from '../types'

/**
 * Resolve database configuration from string or object format
 */
export async function resolveDatabaseConfig(nuxt: Nuxt, hub: HubConfig): Promise<ResolvedDatabaseConfig | false> {
  if (!hub.database) return false

  let config = typeof hub.database === 'string' ? { dialect: hub.database } : hub.database
  config = defu(config, {
    migrationsDirs: nuxt.options._layers?.map(layer => join(layer.config.serverDir!, 'database/migrations')).filter(Boolean),
    queriesPaths: [],
    applyMigrationsDuringBuild: true
  })

  switch (config.dialect) {
    case 'sqlite': {
      // Turso Cloud
      if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        config.driver = 'libsql'
        config.connection = defu(config.connection, {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN
        })
        break
      }
      // Cloudflare D1
      if (hub.hosting.includes('cloudflare')) {
        config.driver = 'd1'
        break
      }
      // Local SQLite
      config.driver ||= 'libsql'
      config.connection = defu(config.connection, { url: `file:${join(hub.dir!, 'database/sqlite.db')}` })
      await mkdir(join(hub.dir, 'database'), { recursive: true })
      break
    }
    case 'postgresql': {
      config.connection = defu(config.connection, { url: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || '' })
      if (config.connection.url) {
        config.driver ||= 'node-postgres'
        break
      }
      // Local PGLite
      config.driver ||= 'pglite'
      config.connection = defu(config.connection, { dataDir: join(hub.dir!, 'database/pglite') })
      await mkdir(join(hub.dir, 'database/pglite'), { recursive: true })
      break
    }
    case 'mysql': {
      config.driver ||= 'mysql2'
      config.connection = defu(config.connection, { url: process.env.DATABASE_URL || process.env.MYSQL_URL || '' })
      if (!config.connection.url) {
        throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable')
      }
      break
    }
  }

  // Disable migrations if database connection is not supported in CI
  if (config.driver === 'd1') {
    config.applyMigrationsDuringBuild = false
  }

  return config as ResolvedDatabaseConfig
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.database = await resolveDatabaseConfig(nuxt, hub)
  if (!hub.database) return

  const { dialect, driver, connection, migrationsDirs, queriesPaths } = hub.database as ResolvedDatabaseConfig

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
    await nuxt.callHook('hub:database:migrations:dirs', migrationsDirs)
    // Copy all migrations files to the hub.dir directory
    await copyDatabaseMigrationsToHubDir(hub)
    // Call hub:database:queries:paths hook
    await nuxt.callHook('hub:database:queries:paths', queriesPaths)
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
  if (['node-postgres', 'mysql2'].includes(driver) && hub.hosting.includes('cloudflare')) {
    const bindingName = driver === 'node-postgres' ? 'POSTGRES' : 'MYSQL'
    drizzleOrmContent = `import { drizzle as drizzleClient } from 'drizzle-orm/${driver}'

let _drizzle = null
export function drizzle(options) {
  if (!_drizzle) {
    const hyperdrive = process.env.${bindingName} || globalThis.__env__?.${bindingName} || globalThis.${bindingName}
    if (!hyperdrive?.connectionString) throw new Error('Cannot find the Hyperdrive database attached to \`${bindingName}\` binding')
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
