import { mkdir } from 'node:fs/promises'
import type { Nuxt } from '@nuxt/schema'
import { join } from 'pathe'
import { logger, addImportsDir, addServerImportsDir, addServerScanDir, createResolver } from '@nuxt/kit'
import { defu } from 'defu'
import { addDevToolsCustomTabs } from './utils/devtools'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from './runtime/database/server/utils/migrations/helpers'
import type { ConnectorName } from 'db0'

const log = logger.withTag('nuxt:hub')
const { resolve } = createResolver(import.meta.url)

export interface HubConfig {
  version?: string

  blob?: boolean
  cache?: boolean
  database?: boolean | 'postgresql' | 'sqlite' | 'mysql'
  kv?: boolean

  dir?: string
  databaseMigrationsDirs?: string[]
  databaseQueriesPaths?: string[]
}

export async function setupBase(nuxt: Nuxt, hub: HubConfig) {
  // Create the hub.dir directory
  hub.dir = join(nuxt.options.rootDir, hub.dir!)
  try {
    await mkdir(hub.dir, { recursive: true })
  } catch (e: any) {
    if (e.errno === -17) {
      // File already exists
    } else {
      throw e
    }
  }

  // Add custom tabs to Nuxt DevTools
  if (nuxt.options.dev) {
    addDevToolsCustomTabs(nuxt, hub)
  }

  // TODO: evaluate if we even need routes outside development
  // Add routeRules to work with some security modules
  nuxt.options.routeRules = nuxt.options.routeRules || {}
  nuxt.options.routeRules['/api/_hub/**'] = nuxt.options.routeRules['/api/_hub/**'] || {}
  // @ts-expect-error csurf is not typed here
  nuxt.options.routeRules['/api/_hub/**'].csurf = false
  nuxt.options.routeRules['/api/_hub/**'].cache = false
  nuxt.options.routeRules['/api/_hub/**'].prerender = false
  // Remove trailing slash for prerender routes
  nuxt.options.nitro.prerender ||= {}
  nuxt.options.nitro.prerender.autoSubfolderIndex ||= false
}

export async function setupAI(_nuxt: Nuxt, _hub: HubConfig) {
  return log.warn('hubAI() is not supported yet')
}

export function setupBlob(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro = defu(nuxt.options.nitro, {
    devStorage: {
      blob: {
        driver: 'fs',
        base: join(hub.dir!, 'blob')
      }
    }
  })

  // Add Server scanning
  addServerScanDir(resolve('./runtime/blob/server'))
  addServerImportsDir(resolve('./runtime/blob/server/utils'))

  // Add Composables
  addImportsDir(resolve('./runtime/blob/app/composables'))

  if (nuxt.options.nitro.storage?.blob?.driver === 'vercel-blob') {
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
  }
}

export async function setupCache(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro = defu(nuxt.options.nitro, {
    devStorage: {
      cache: {
        driver: 'fs',
        base: join(hub.dir!, 'cache')
      }
    }
  })

  // Add Server scanning
  addServerScanDir(resolve('./runtime/cache/server'))
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  if (typeof hub.database === 'string' && !['postgresql', 'sqlite', 'mysql'].includes(hub.database)) {
    return log.error(`Unknown database dialect set in hub.database: ${hub.database}`)
  }

  let dialect: string
  const productionDriver = nuxt.options.nitro.database?.db?.connector as ConnectorName
  const isDialectConfigured = typeof hub.database === 'string' && (['postgresql', 'sqlite', 'mysql'].includes(hub.database))
  if (isDialectConfigured) {
    dialect = hub.database as string
  } else {
    // Infer dialect from production database driver
    // Map connectors to dialects based on the mappings:
    // "postgresql" -> "postgresql", pglite
    // "sqlite" -> "better-sqlite3", bun-sqlite, bun, node-sqlite, sqlite3
    // "mysql" -> mysql2
    // "libsql" -> libsql-core, libsql-http, libsql-node, libsql-web
    if (productionDriver === 'postgresql' || productionDriver === 'pglite') {
      dialect = 'postgresql'
    } else if (['better-sqlite3', 'bun-sqlite', 'bun', 'node-sqlite', 'sqlite3'].includes(productionDriver)) {
      dialect = 'sqlite'
    } else if (productionDriver === 'mysql2') {
      dialect = 'mysql'
    } else if (['libsql-core', 'libsql-http', 'libsql-node', 'libsql-web'].includes(productionDriver)) {
      // NOTE: libSQL implements additional functionality beyond sqlite, but users can manually configure a libsql database within Nitro if they require them
      dialect = 'sqlite' // libsql is SQLite-compatible
    } else {
      return log.error('Please specify adatabase dialect in `hub.database: \'<dialect>\'` or configure `nitro.database.db` within `nuxt.config.ts`. Learn more at https://hub.nuxt.com/docs/features/database.')
    }
  }

  // Check if the configured dialect matches the production driver
  if (isDialectConfigured && productionDriver) {
    const dialectMatchesDriver = (
      (dialect === 'postgresql' && (productionDriver === 'postgresql' || productionDriver === 'pglite'))
      || (dialect === 'sqlite' && ['better-sqlite3', 'bun-sqlite', 'bun', 'node-sqlite', 'sqlite3', 'libsql-core', 'libsql-http', 'libsql-node', 'libsql-web'].includes(productionDriver))
      || (dialect === 'mysql' && productionDriver === 'mysql2')
    )

    if (!dialectMatchesDriver) {
      // Infer the dialect from the production driver for the error message
      let inferredDialect: string
      if (productionDriver === 'postgresql' || productionDriver === 'pglite') {
        inferredDialect = 'postgresql'
      } else if (['better-sqlite3', 'bun-sqlite', 'bun', 'node-sqlite', 'sqlite3', 'libsql-core', 'libsql-http', 'libsql-node', 'libsql-web'].includes(productionDriver)) {
        inferredDialect = 'sqlite'
      } else if (productionDriver === 'mysql2') {
        inferredDialect = 'mysql'
      } else {
        inferredDialect = 'unknown'
      }

      log.warn(`Database dialect mismatch: \`hub.database\` is set to \`${dialect}\` but \`nitro.database.db\` is \`${inferredDialect}\` (\`${productionDriver}\`). Set \`hub.database\` to \`true\` or \`'${inferredDialect}'\` in your \`nuxt.config.ts\`.`)
    }
  }

  // Configure dev database based on dialect
  let devDatabaseConfig: any

  if (dialect === 'postgresql') {
    if (process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL) {
      // Use postgresql if env variable is set
      const setEnvVarName = process.env.POSTGRES_URL ? 'POSTGRES_URL' : process.env.POSTGRESQL_URL ? 'POSTGRESQL_URL' : 'DATABASE_URL'
      log.info(`Using PostgreSQL during local development using provided \`${setEnvVarName}\``)
      devDatabaseConfig = {
        db: {
          connector: 'postgresql',
          options: {
            url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
          }
        }
      }
    } else {
      // Use pglite if env variable not provided
      log.info('Using PGlite during local development')
      devDatabaseConfig = {
        db: {
          connector: 'pglite',
          options: {
            dataDir: join(hub.dir!, 'database/pglite')
          }
        }
      }
    }
  } else if (dialect === 'sqlite') {
    log.info('Using SQLite during local development')
    devDatabaseConfig = {
      db: {
        connector: 'better-sqlite3',
        options: {
          path: join(hub.dir!, 'database/sqlite/db.sqlite3')
        }
      }
    }
  } else if (dialect === 'mysql') {
    if (!nuxt.options.nitro.devDatabase?.db?.connector) {
      log.warn('Zero-config MySQL database setup during local development is not supported yet. Please manually configure your development database in `nitro.devDatabase.db` in `nuxt.config.ts`. Learn more at https://hub.nuxt.com/docs/features/database.')
    }
  }

  nuxt.options.nitro = defu(nuxt.options.nitro, {
    devDatabase: devDatabaseConfig
  })

  // Enable Nitro database
  nuxt.options.nitro.experimental ||= {}
  nuxt.options.nitro.experimental.database = true

  // Add Server scanning
  addServerScanDir(resolve('./runtime/database/server'))
  addServerImportsDir(resolve('./runtime/database/server/utils'))

  // Handle migrations
  nuxt.hook('modules:done', async () => {
    // Call hub:database:migrations:dirs hook
    await nuxt.callHook('hub:database:migrations:dirs', hub.databaseMigrationsDirs!)
    // Copy all migrations files to the hub.dir directory
    await copyDatabaseMigrationsToHubDir(hub)
    // Call hub:database:migrations:queries hook
    await nuxt.callHook('hub:database:queries:paths', hub.databaseQueriesPaths!)
    await copyDatabaseQueriesToHubDir(hub)
  })
}

export function setupKV(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro = defu(nuxt.options.nitro, {
    devStorage: {
      kv: {
        driver: 'fs',
        base: join(hub.dir!, 'kv')
      }
    }
  })

  // Add Server scanning
  addServerScanDir(resolve('./runtime/kv/server'))
  addServerImportsDir(resolve('./runtime/kv/server/utils'))
}

export function setupOpenAPI(nuxt: Nuxt, _hub: HubConfig) {
  // Enable Nitro database
  nuxt.options.nitro.experimental ||= {}
  nuxt.options.nitro.experimental.openAPI ??= true
}
