import { mkdir, writeFile } from 'node:fs/promises'
import type { Nuxt } from '@nuxt/schema'
import { join } from 'pathe'
import { logger, addImportsDir, addServerImportsDir, addServerScanDir, createResolver, addTypeTemplate } from '@nuxt/kit'
import { defu } from 'defu'
import { addDevToolsCustomTabs } from './utils/devtools'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from './runtime/database/server/utils/migrations/helpers'
import type { ConnectorName } from 'db0'
import type { NitroOptions } from 'nitropack'
import { ensureDependencyInstalled } from 'nypm'

const log = logger.withTag('nuxt:hub')
const { resolve } = createResolver(import.meta.url)

function logWhenReady(nuxt: Nuxt, message: string, type: 'info' | 'warn' | 'error' = 'info') {
  nuxt.hook('modules:done', () => {
    log[type](message)
  })
}

export interface HubConfig {
  version?: string

  ai?: 'vercel' | 'cloudflare'
  blob?: boolean
  cache?: boolean
  database?: boolean | 'postgresql' | 'sqlite' | 'mysql'
  kv?: boolean

  dir?: string
  databaseMigrationsDirs?: string[]
  databaseQueriesPaths?: string[]
  applyDatabaseMigrationsDuringBuild?: boolean
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

  // Remove trailing slash for prerender routes
  nuxt.options.nitro.prerender ||= {}
  nuxt.options.nitro.prerender.autoSubfolderIndex ||= false
}

export async function setupAI(nuxt: Nuxt, hub: HubConfig) {
  const providerName = hub.ai === 'vercel' ? 'Vercel AI Gateway' : 'Workers AI Provider'

  if (hub.ai === 'vercel') {
    await Promise.all([
      ensureDependencyInstalled('@ai-sdk/gateway')
    ])
  } else if (hub.ai === 'cloudflare') {
    await Promise.all([
      ensureDependencyInstalled('workers-ai-provider')
    ])
  } else {
    return logWhenReady(nuxt, `\`${hub.ai}\` is not a supported AI provider. Set \`hub.ai\` to \`'vercel'\` or \`'cloudflare'\` in your \`nuxt.config.ts\`. Learn more at https://hub.nuxt.com/docs/features/ai.`, 'error')
  }

  // Used for typing hubAI() with the correct provider
  addTypeTemplate({
    filename: 'types/nuxthub-ai.d.ts',
    getContents: () => `export type NuxtHubAIProvider = ${JSON.stringify(hub.ai)}
    `
  })

  if (hub.ai === 'cloudflare') {
    const isCloudflareRuntime = nuxt.options.nitro.preset?.includes('cloudflare')
    const isAiBindingSet = !!(process.env.AI as { runtime: string } | undefined)?.runtime

    if (isCloudflareRuntime && !isAiBindingSet) {
      return logWhenReady(nuxt, 'Ensure a `AI` binding is set in your Cloudflare Workers configuration', 'error')
    }

    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_KEY) {
      return logWhenReady(nuxt, `Set \`CLOUDFLARE_ACCOUNT_ID\` and \`CLOUDFLARE_API_KEY\` environment variables to enable \`hubAI()\` with ${providerName}`, 'error')
    }
  } else if (hub.ai === 'vercel') {
    const isMissingEnvVars = !process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN
    if (isMissingEnvVars && nuxt.options.dev) {
      return logWhenReady(nuxt, `Missing \`AI_GATEWAY_API_KEY\` environment variable to enable \`hubAI()\` with ${providerName}\nCreate an AI Gateway API key at \`${encodeURI('https://vercel.com/d?to=/[team]/~/ai/api-keys&title=Go+to+AI+Gateway')}\` or run \`npx vercel env pull .env\` to pull the environment variables.`, 'error')
    } else if (isMissingEnvVars) {
      return logWhenReady(nuxt, `Set \`AI_GATEWAY_API_KEY\` environment variable to enable \`hubAI()\` with ${providerName}\nCreate an AI Gateway API key at \`${encodeURI('https://vercel.com/d?to=/[team]/~/ai/api-keys&title=Go+to+AI+Gateway')}\``, 'error')
    }
  }

  // Add Server scanning
  addServerScanDir(resolve('./runtime/ai/server'))
  addServerImportsDir(resolve('./runtime/ai/server/utils'))

  logWhenReady(nuxt, `\`hubAI()\` configured for ${providerName}`)
}

export function setupBlob(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro.devStorage ||= {}
  nuxt.options.nitro.devStorage.blob = defu(nuxt.options.nitro.devStorage.blob, {
    driver: 'fs',
    base: join(hub.dir!, 'blob')
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
  nuxt.options.nitro.devStorage ||= {}
  nuxt.options.nitro.devStorage.cache = defu(nuxt.options.nitro.devStorage.cache, {
    driver: 'fs',
    base: join(hub.dir!, 'cache')
  })

  // Add Server scanning
  addServerScanDir(resolve('./runtime/cache/server'))
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  if (typeof hub.database === 'string' && !['postgresql', 'sqlite', 'mysql'].includes(hub.database)) {
    return logWhenReady(nuxt, `Unknown database dialect set in hub.database: ${hub.database}`, 'error')
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
      return logWhenReady(nuxt, 'Please specify a database dialect in `hub.database: \'<dialect>\'` or configure `nitro.database.db` within `nuxt.config.ts`. Learn more at https://hub.nuxt.com/docs/features/database.', 'error')
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

      logWhenReady(nuxt, `Database dialect mismatch: \`hub.database\` is set to \`${dialect}\` but \`nitro.database.db\` is \`${inferredDialect}\` (\`${productionDriver}\`). Set \`hub.database\` to \`true\` or \`'${inferredDialect}'\` in your \`nuxt.config.ts\`.`, 'warn')
    }
  }

  // Configure dev database based on dialect
  let devDatabaseConfig: NitroOptions['database']['default']

  if (dialect === 'postgresql') {
    if (process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL) {
      // Use postgresql if env variable is set
      const setEnvVarName = process.env.POSTGRES_URL ? 'POSTGRES_URL' : process.env.POSTGRESQL_URL ? 'POSTGRESQL_URL' : 'DATABASE_URL'
      logWhenReady(nuxt, `Using \`PostgreSQL\` during local development using provided \`${setEnvVarName}\``)
      devDatabaseConfig = {
        connector: 'postgresql',
        options: {
          url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
        }
      }
    } else {
      // Use pglite if env variable not provided
      logWhenReady(nuxt, 'Using `PGlite` during local development')
      devDatabaseConfig = {
        connector: 'pglite',
        options: {
          dataDir: join(hub.dir!, 'database/pglite')
        }
      }
    }
  } else if (dialect === 'sqlite') {
    logWhenReady(nuxt, 'Using `SQLite` during local development')
    devDatabaseConfig = {
      connector: 'better-sqlite3',
      options: {
        path: join(hub.dir!, 'database/sqlite/db.sqlite3')
      }
    }
  } else if (dialect === 'mysql') {
    if (!nuxt.options.nitro.devDatabase?.db?.connector) {
      logWhenReady(nuxt, 'Zero-config `MySQL` database setup during local development is not supported yet. Please manually configure your development database in `nitro.devDatabase.db` in `nuxt.config.ts`. Learn more at https://hub.nuxt.com/docs/features/database.', 'warn')
    }
  }

  nuxt.options.nitro.devDatabase ||= {}
  nuxt.options.nitro.devDatabase.db = defu(nuxt.options.nitro.devDatabase.db, devDatabaseConfig!) as NitroOptions['database']['default']

  // Verify development database dependencies are installed
  const developmentDriver = nuxt.options.nitro.devDatabase?.db?.connector as ConnectorName
  if (developmentDriver === 'postgresql') {
    await ensureDependencyInstalled('pg')
  } else if (developmentDriver === 'pglite') {
    await ensureDependencyInstalled('@electric-sql/pglite')
  } else if (developmentDriver === 'mysql2') {
    await ensureDependencyInstalled('mysql2')
  } else if (developmentDriver === 'better-sqlite3') {
    await ensureDependencyInstalled('better-sqlite3')
  }

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

  // Setup Drizzle ORM
  let isDrizzleOrmInstalled = false
  try {
    require.resolve('drizzle-orm', { paths: [nuxt.options.rootDir] })
    isDrizzleOrmInstalled = true
  } catch {
    // Ignore
  }

  if (isDrizzleOrmInstalled) {
    const connector = nuxt.options.nitro.devDatabase.db.connector as ConnectorName
    const dbConfig = nuxt.options.nitro.devDatabase.db.options

    // @ts-expect-error not all connectors are supported
    const db0ToDrizzle: Record<ConnectorName, string> = {
      postgresql: 'node-postgres',
      pglite: 'pglite',
      mysql2: 'mysql2',
      planetscale: 'planetscale-serverless',
      'better-sqlite3': 'better-sqlite3',
      'bun-sqlite': 'bun-sqlite',
      bun: 'bun-sqlite',
      sqlite3: 'better-sqlite3',
      libsql: 'libsql/node',
      'libsql-core': 'libsql',
      'libsql-http': 'libsql/http',
      'libsql-node': 'libsql/node',
      'libsql-web': 'libsql/web',
      'cloudflare-d1': 'd1'
      // unsupported: sqlite & node-sqlite
    }

    // node-postgres requires connectionString instead of url
    let connectionConfig = dbConfig
    if (connector === 'postgresql' && dbConfig?.url) {
      connectionConfig = { connectionString: dbConfig.url, ...dbConfig.options }
    }

    let drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${db0ToDrizzle[connector]}'
import type { DrizzleConfig } from 'drizzle-orm'

export function hubDrizzle<TSchema extends Record<string, unknown> = Record<string, never>>(options?: DrizzleConfig<TSchema>) {
  return drizzle({
    ...options,
    connection: ${JSON.stringify(connectionConfig)}
  })
}`

    if (connector === 'pglite') {
      drizzleOrmContent = `import { drizzle } from 'drizzle-orm/pg-proxy'
import type { DrizzleConfig } from 'drizzle-orm'

export function hubDrizzle<TSchema extends Record<string, unknown> = Record<string, never>>(options?: DrizzleConfig<TSchema>) {
  return drizzle(async (sql, params, method) => {
    try {
      const rows = await $fetch<any[]>('/api/_hub/database/query', { method: 'POST', body: { sql, params, method } })
      return { rows }
    } catch (e: any) {
      console.error(e.response)
      return { rows: [] }
    }
  }, {
    ...options,
  })
}`
    }

    // create hub directory in .nuxt if it doesn't exist
    const hubBuildDir = join(nuxt.options.buildDir, 'hub')
    await mkdir(hubBuildDir, { recursive: true })

    const drizzleOrmPath = join(hubBuildDir, 'drizzle-orm.ts')
    await writeFile(drizzleOrmPath, drizzleOrmContent, 'utf-8')

    nuxt.options.alias['#hub/drizzle-orm'] = drizzleOrmPath
  }
}

export function setupKV(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro.devStorage ||= {}
  nuxt.options.nitro.devStorage.kv = defu(nuxt.options.nitro.devStorage.kv, {
    driver: 'fs',
    base: join(hub.dir!, 'kv')
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
