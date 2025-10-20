import { mkdir } from 'node:fs/promises'
import { defu } from 'defu'
import { join } from 'pathe'
import { addServerImportsDir, addServerScanDir, addTemplate, addTypeTemplate, logger } from '@nuxt/kit'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from '../runtime/database/server/utils/migrations/helpers'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { Nitro } from 'nitropack'
import type { HubConfig, ResolvedDatabaseConfig } from '../features'
import type { DatabaseConfig } from '../types/module'

const log = logger.withTag('nuxt:hub')

/**
 * Resolve database configuration from string or object format
 */
export function resolveDatabaseConfig(database: string | DatabaseConfig, isDev: boolean): ResolvedDatabaseConfig {
  let dialect: 'sqlite' | 'postgresql' | 'mysql'
  let connection: Record<string, any> = {}
  let driver: string | undefined

  // If it's a string, parse it and auto-detect connection
  if (typeof database === 'string') {
    dialect = database as 'sqlite' | 'postgresql' | 'mysql'

    // Auto-detect connection based on environment variables
    if (dialect === 'sqlite') {
      if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        connection = {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN
        }
      } else {
        // Local SQLite - connection will be set later based on hub.dir
        connection = {}
      }
    } else if (dialect === 'postgresql') {
      const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL
      if (url) {
        connection = { connectionString: url }
      } else {
        // PGlite - connection will be set later based on hub.dir
        connection = {}
      }
    } else if (dialect === 'mysql') {
      connection = { url: process.env.DATABASE_URL || process.env.MYSQL_URL }
      if (!connection.url) {
        throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable')
      }
    }
  } else {
    // It's a DatabaseConfig object
    dialect = database.dialect
    connection = { ...database.connection }
    driver = database.driver // Use user-specified driver if provided
  }

  // Auto-detect driver if not explicitly provided
  if (!driver) {
    if (dialect === 'sqlite') {
      driver = 'libsql'
    } else if (dialect === 'postgresql') {
      if (connection.connectionString || connection.url || connection.host) {
        driver = 'node-postgres'
      } else {
        driver = 'pglite'
      }
    } else {
      driver = 'mysql2'
    }
  }

  return { dialect, driver, connection }
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  // Database config is already resolved in module.ts
  const dbConfig = hub.database
  if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string' || !('driver' in dbConfig)) {
    throw new Error('Database configuration should be resolved before setupDatabase is called')
  }

  const { driver, connection } = dbConfig as ResolvedDatabaseConfig

  // Set up local storage paths for local databases
  if (driver === 'libsql' && !connection.url) {
    connection.url = `file:${join(hub.dir!, 'database/sqlite.db')}`
    await mkdir(join(hub.dir!, 'database/sqlite'), { recursive: true })
    logWhenReady(nuxt, '`drizzle()` configured with `SQLite` during local development')
  } else if (driver === 'libsql' && connection.url && connection.authToken) {
    logWhenReady(nuxt, `\`drizzle()\` configured with \`Turso\` using provided \`TURSO_DATABASE_URL\` and \`TURSO_AUTH_TOKEN\``)
  } else if (driver === 'pglite' && !connection.connectionString) {
    connection.dataDir = join(hub.dir!, 'database/pglite')
    await mkdir(join(hub.dir!, 'database/pglite'), { recursive: true })
    logWhenReady(nuxt, '`drizzle()` configured with `PGlite` during local development')
  } else if (driver === 'node-postgres' && connection.connectionString) {
    const envVarName = process.env.POSTGRES_URL ? 'POSTGRES_URL' : process.env.POSTGRESQL_URL ? 'POSTGRESQL_URL' : 'DATABASE_URL'
    logWhenReady(nuxt, `\`drizzle()\` configured with \`PostgreSQL\` using provided \`${envVarName}\``)
  } else if (driver === 'mysql2') {
    if (!connection.url) {
      logWhenReady(nuxt, '`drizzle()` configured with `MySQL` requires DATABASE_URL or MYSQL_URL environment variable', 'warn')
    }
  }

  // Verify development database dependencies are installed
  if (driver === 'node-postgres' && !deps.pg) {
    logWhenReady(nuxt, 'Please run `npx nypm i pg` to use PostgreSQL as database.', 'error')
  } else if (driver === 'pglite' && !deps['@electric-sql/pglite']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @electric-sql/pglite` to use PGlite as database.', 'error')
  } else if (driver === 'mysql2' && !deps.mysql2) {
    logWhenReady(nuxt, 'Please run `npx nypm i mysql2` to use MySQL as database.', 'error')
  } else if (driver === 'libsql' && !deps['@libsql/client']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @libsql/client` to use Turso as database.', 'error')
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
  if (deps['drizzle-orm']) {
    const drizzleOrmTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driver}'

declare module '#hub/database' {
  export function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(options?: DrizzleConfig<TSchema>): ReturnType<typeof drizzleCore<TSchema>>
}`

    // Generate simplified drizzle() implementation
    let drizzleOrmContent = ''

    if (driver === 'd1') {
      // D1 requires binding from environment
      drizzleOrmContent = `import { drizzle as drizzleCore } from 'drizzle-orm/d1'

let _drizzle = null

export function drizzle(options) {
  if (_drizzle) return _drizzle
  const binding = process.env.DB || globalThis.DB
  if (!binding) {
    throw new Error('D1 binding "DB" not found')
  }
  _drizzle = drizzleCore(binding, options)
  return _drizzle
}`
    } else {
      // All other drivers support connection config
      drizzleOrmContent = `import { drizzle as drizzleCore } from 'drizzle-orm/${driver}'

let _drizzle = null

export function drizzle(options) {
  if (_drizzle) return _drizzle
  _drizzle = drizzleCore({
    connection: ${JSON.stringify(connection)},
    ...options
  })
  return _drizzle
}`
    }

    const template = addTemplate({
      filename: 'hub/database.mjs',
      getContents: () => drizzleOrmContent,
      write: true
    })
    nuxt.options.nitro.alias!['#hub/database'] = template.dst
    addTypeTemplate({
      filename: 'hub/database.d.ts',
      getContents: () => drizzleOrmTypes,
    }, { nitro: true })
  }
}

export async function setupProductionDatabase(nitro: Nitro, hub: HubConfig, deps: Record<string, string>) {
  const preset = nitro.options.preset
  if (!preset) return

  // Get the resolved database configuration from runtime config
  const dbConfig = nitro.options.runtimeConfig?.hub?.database
  if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string') {
    log.warn('Database configuration not resolved, skipping production database setup')
    return
  }

  let { dialect, driver, connection } = dbConfig

  // Override driver based on preset
  switch (preset) {
    case 'vercel': {
      if (dialect === 'postgresql') {
        if (connection.connectionString || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL) {
          connection.connectionString = connection.connectionString || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
          driver = 'node-postgres'
        } else {
          log.warn('Set POSTGRES_URL, POSTGRESQL_URL, or DATABASE_URL environment variable to configure PostgreSQL database')
          if (hub.applyDatabaseMigrationsDuringBuild) {
            hub.applyDatabaseMigrationsDuringBuild = false
            log.warn('Skipping database migrations - missing database environment variables')
          }
        }
      } else if (dialect === 'mysql') {
        if (!connection.url && !process.env.DATABASE_URL && !process.env.MYSQL_URL) {
          throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable')
        }
        connection.url = connection.url || process.env.DATABASE_URL || process.env.MYSQL_URL
        driver = 'mysql2'
      } else if (dialect === 'sqlite') {
        if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
          connection = {
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
          }
          driver = 'libsql'
        } else {
          throw new Error('SQLite on Vercel requires Turso (TURSO_DATABASE_URL and TURSO_AUTH_TOKEN)')
        }
      }
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      nitro.options.cloudflare ||= {}

      if (dialect === 'sqlite') {
        if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
          connection = {
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
          }
          driver = 'libsql'
        } else {
          // Use D1
          driver = 'd1'
          connection = { bindingName: 'DB' }

          log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${preset === 'cloudflare-pages' ? 'Pages' : 'Workers'} configuration`)

          nitro.options.cloudflare.wrangler ||= {}
          nitro.options.cloudflare.wrangler.d1_databases ||= []

          let dbBinding = nitro.options.cloudflare.wrangler.d1_databases.find(db => db.binding === 'DB')
          if (!dbBinding) {
            dbBinding = { binding: 'DB' }
            nitro.options.cloudflare.wrangler.d1_databases.push(dbBinding)
          }

          dbBinding.migrations_table ||= '_hub_migrations'
          dbBinding.migrations_dir ||= 'migrations'
        }
      } else if (dialect === 'postgresql') {
        driver = 'cloudflare-hyperdrive-postgresql'
        connection = { bindingName: 'DB' }
        log.info(`Ensure a \`DB\` Hyperdrive binding is set in your Cloudflare ${preset === 'cloudflare-pages' ? 'Pages' : 'Workers'} configuration`)
      } else if (dialect === 'mysql') {
        driver = 'cloudflare-hyperdrive-mysql'
        connection = { bindingName: 'DB' }
        log.info(`Ensure a \`DB\` Hyperdrive binding is set in your Cloudflare ${preset === 'cloudflare-pages' ? 'Pages' : 'Workers'} configuration`)
      }

      // TODO: D1 migrations via wrangler migrations dir
      if (hub.applyDatabaseMigrationsDuringBuild) {
        hub.applyDatabaseMigrationsDuringBuild = false
        log.warn('Skipping database migrations - Currently Cloudflare is not supported')
      }
      break
    }

    default: {
      if (dialect === 'postgresql') {
        const url = connection.connectionString || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
        if (url) {
          connection.connectionString = url
          driver = 'node-postgres'
        } else {
          log.info('Set `POSTGRES_URL`, `POSTGRESQL_URL`, or `DATABASE_URL` environment variable to configure PostgreSQL database')
          if (hub.applyDatabaseMigrationsDuringBuild) {
            hub.applyDatabaseMigrationsDuringBuild = false
            log.warn('Skipping database migrations - missing database environment variables')
          }
        }
      } else if (dialect === 'mysql') {
        const url = connection.url || process.env.DATABASE_URL || process.env.MYSQL_URL
        if (!url) {
          throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable')
        }
        connection.url = url
        driver = 'mysql2'
      } else if (dialect === 'sqlite') {
        if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
          connection = {
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
          }
          driver = 'libsql'
        } else {
          connection.url = 'file:.data/database/sqlite.db'
          driver = 'libsql'
        }
      }
      break
    }
  }

  // Store the resolved production configuration
  nitro.options.runtimeConfig = nitro.options.runtimeConfig || {}
  nitro.options.runtimeConfig.hub = nitro.options.runtimeConfig.hub || {}
  nitro.options.runtimeConfig.hub.database = {
    dialect,
    driver,
    connection
  }

  log.info(`\`drizzle()\` configured with \`${driver}\` driver for production`)
}
