import { mkdir, writeFile } from 'node:fs/promises'
import { defu } from 'defu'
import { join } from 'pathe'
import { addServerImportsDir, addServerScanDir, addServerTemplate, addTemplate, addTypeTemplate, logger } from '@nuxt/kit'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from '../runtime/database/server/utils/migrations/helpers'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { NitroOptions, Nitro } from 'nitropack'
import type { ConnectorName } from 'db0'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
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
    } else if (['libsql', 'libsql-core', 'libsql-http', 'libsql-node', 'libsql-web'].includes(productionDriver)) {
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
      || (dialect === 'sqlite' && ['better-sqlite3', 'bun-sqlite', 'bun', 'node-sqlite', 'sqlite3', 'libsql', 'libsql-core', 'libsql-http', 'libsql-node', 'libsql-web'].includes(productionDriver))
      || (dialect === 'mysql' && productionDriver === 'mysql2')
    )

    if (!dialectMatchesDriver) {
      // Infer the dialect from the production driver for the error message
      let inferredDialect: string
      if (productionDriver === 'postgresql' || productionDriver === 'pglite') {
        inferredDialect = 'postgresql'
      } else if (['better-sqlite3', 'bun-sqlite', 'bun', 'node-sqlite', 'sqlite3', 'libsql', 'libsql-core', 'libsql-http', 'libsql-node', 'libsql-web'].includes(productionDriver)) {
        inferredDialect = 'sqlite'
      } else if (productionDriver === 'mysql2') {
        inferredDialect = 'mysql'
      } else {
        inferredDialect = 'unknown'
      }

      logWhenReady(nuxt, `Database dialect mismatch: \`hub.database\` is set to \`${dialect}\` but \`nitro.database.db\` is \`${inferredDialect}\` (\`${productionDriver}\`). Set \`hub.database\` to \`'${inferredDialect}'\` in your \`nuxt.config.ts\`.`, 'warn')
    }
  }

  // Configure dev database based on dialect
  let devDatabaseConfig: NitroOptions['database']['default']

  if (dialect === 'postgresql') {
    if (process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL) {
      // Use postgresql if env variable is set
      const setEnvVarName = process.env.POSTGRES_URL ? 'POSTGRES_URL' : process.env.POSTGRESQL_URL ? 'POSTGRESQL_URL' : 'DATABASE_URL'
      logWhenReady(nuxt, `\`hubDatabase()\` configured with \`PostgreSQL\` using provided \`${setEnvVarName}\``)
      devDatabaseConfig = {
        connector: 'postgresql',
        options: {
          url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
        }
      }
    } else {
      // Use pglite if env variable not provided
      logWhenReady(nuxt, '`hubDatabase()` configured with `PGlite` during local development')
      devDatabaseConfig = {
        connector: 'pglite',
        options: {
          dataDir: join(hub.dir!, 'database/pglite')
        }
      }
      await mkdir(join(hub.dir!, 'database/pglite'), { recursive: true })
    }
  } else if (dialect === 'sqlite') {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      logWhenReady(nuxt, `\`hubDatabase()\` configured with \`SQLite\` and \`Turso\` using provided \`TURSO_DATABASE_URL\` and \`TURSO_AUTH_TOKEN\``)
      devDatabaseConfig = {
        connector: 'libsql',
        options: {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN
        }
      }
    } else {
      logWhenReady(nuxt, '`hubDatabase()` configured with `SQLite` during local development')
      devDatabaseConfig = {
        connector: 'better-sqlite3',
        options: {
          path: join(hub.dir!, 'database/sqlite/db.sqlite3')
        }
      }
      await mkdir(join(hub.dir!, 'database/sqlite'), { recursive: true })
    }
  } else if (dialect === 'mysql') {
    if (!nuxt.options.nitro.devDatabase?.db?.connector) {
      logWhenReady(nuxt, '`hubDatabase()` configured with `MySQL` during local development is not supported yet. Please manually configure your development database in `nitro.devDatabase.db` in `nuxt.config.ts`. Learn more at https://hub.nuxt.com/docs/features/database.', 'warn')
    }
  }

  nuxt.options.nitro.devDatabase ||= {}
  nuxt.options.nitro.devDatabase.db = defu(nuxt.options.nitro.devDatabase.db, devDatabaseConfig!) as NitroOptions['database']['default']

  // Verify development database dependencies are installed
  const developmentDriver = nuxt.options.nitro.devDatabase?.db?.connector as ConnectorName
  if (developmentDriver === 'postgresql' && !deps.pg) {
    logWhenReady(nuxt, 'Please run `npx nypm i pg` to use PostgreSQL as database.', 'error')
  } else if (developmentDriver === 'pglite' && !deps['@electric-sql/pglite']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @electric-sql/pglite` to use PGlite as database.', 'error')
  } else if (developmentDriver === 'mysql2' && !deps.mysql2) {
    logWhenReady(nuxt, 'Please run `npx nypm i mysql2` to use MySQL as database.', 'error')
  } else if (developmentDriver === 'better-sqlite3' && !deps['better-sqlite3']) {
    logWhenReady(nuxt, 'Please run `npx nypm i better-sqlite3` to use SQLite as database.', 'error')
  } else if (developmentDriver.includes('libsql') && !deps['@libsql/client']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @libsql/client` to use libSQL as database.', 'error')
  }

  // Enable Nitro database
  nuxt.options.nitro.experimental ||= {}
  nuxt.options.nitro.experimental.database = true

  // Add Server scanning
  addServerScanDir(resolve('runtime/database/server'))
  addServerImportsDir(resolve('runtime/database/server/utils'))

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
  if (deps['drizzle-orm']) {
    const connector = nuxt.options.nitro.devDatabase.db.connector as ConnectorName
    const dbConfig = nuxt.options.nitro.devDatabase.db.options

    // @ts-expect-error not all connectors are supported
    const db0ToDrizzle: Record<ConnectorName, string> = {
      postgresql: 'node-postgres',
      pglite: 'pg-proxy',
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
    } else if (connector === 'better-sqlite3' && dbConfig?.path) {
      connectionConfig = { source: dbConfig.path, ...dbConfig.options }
    }

    let drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${db0ToDrizzle[connector]}'

export function hubDrizzle(options) {
  return drizzle({
    ...options,
    connection: ${JSON.stringify(connectionConfig)}
  })
}`
    const drizzleOrmTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/${db0ToDrizzle[connector]}'

declare module '#hub/drizzle-orm' {
  export function hubDrizzle<TSchema extends Record<string, unknown> = Record<string, never>>(options?: DrizzleConfig<TSchema>): ReturnType<typeof drizzle<TSchema>>
}`

    if (connector === 'pglite') {
      drizzleOrmContent = `import { drizzle } from 'drizzle-orm/pg-proxy'

export function hubDrizzle(options) {
  return drizzle(async (sql, params, method) => {
    try {
      const rows = await $fetch('/api/_hub/database/query', { method: 'POST', body: { sql, params, method } })
      return { rows }
    } catch (e) {
      return { rows: [] }
    }
  }, {
    ...options,
  })
}`
    }


    // addServerTemplate({
    //   filename: '#hub-drizzle-orm.mjs',
    //   getContents: () => drizzleOrmContent
    // })
    const template = addTemplate({
      filename: 'hub/drizzle-orm.mjs',
      getContents: () => drizzleOrmContent,
      write: true
    })
    nuxt.options.nitro.alias!['#hub/drizzle-orm'] = template.dst
    addTypeTemplate({
      filename: 'hub/drizzle-orm.d.ts',
      getContents: () => drizzleOrmTypes,
    }, { nitro: true })
    addServerImportsDir(resolve('runtime/database/server/drizzle-utils'))
  }
}

export async function setupProductionDatabase(nitro: Nitro, hub: HubConfig, deps: Record<string, string>) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if production database connector is not already set
  if (nitro.options.database?.db?.connector) {
    log.info(`\`hubDatabase()\` configured with \`${nitro.options.database.db.connector}\` driver (defined in \`nuxt.config.ts\`)`)
    return
  }

  const dialect = typeof hub.database === 'string' ? hub.database : hub.database

  let databaseConfig: NitroOptions['database']['default']

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets
    case 'vercel': {
      if (dialect === true || dialect === 'postgresql') {
        databaseConfig = {
          connector: 'postgresql',
          options: {
            url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
          }
        }
        if (!process.env.POSTGRES_URL && !process.env.POSTGRESQL_URL && !process.env.DATABASE_URL) {
          log.warn('Set POSTGRES_URL, POSTGRESQL_URL, or DATABASE_URL environment variable to configure PostgreSQL database')
          if (hub.applyDatabaseMigrationsDuringBuild) {
            hub.applyDatabaseMigrationsDuringBuild = false
            log.warn('Skipping database migrations - missing database environment variables')
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
          databaseConfig = {
            connector: 'libsql',
            options: {
              url: process.env.TURSO_DATABASE_URL,
              authToken: process.env.TURSO_AUTH_TOKEN
            }
          }
        } else {
          throw new Error('SQLite connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts` or connect a Turso database')
        }
      }
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      nitro.options.cloudflare ||= {}

      const isPages = preset === 'cloudflare-pages'
      if (dialect === true || dialect === 'sqlite') {
        databaseConfig = {
          connector: 'cloudflare-d1',
          options: {
            bindingName: 'DB'
          }
        }
        log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${isPages ? 'Pages' : 'Workers'} configuration`)

        nitro.options.cloudflare.wrangler ||= {}
        nitro.options.cloudflare.wrangler.d1_databases ||= []

        let dbBinding = nitro.options.cloudflare.wrangler.d1_databases.find(db => db.binding === 'DB')
        if (!dbBinding) {
          dbBinding = { binding: 'DB' }
          nitro.options.cloudflare.wrangler.d1_databases.push(dbBinding)
        }

        dbBinding.migrations_table ||= '_hub_migrations'
        dbBinding.migrations_dir ||= 'migrations'
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          connector: 'cloudflare-hyperdrive-postgresql',
          options: {
            bindingName: 'DB'
          }
        }

        log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${isPages ? 'Pages' : 'Workers'} configuration`)
      } else if (dialect === 'mysql') {
        databaseConfig = {
          connector: 'cloudflare-hyperdrive-mysql',
          options: {
            bindingName: 'DB'
          }
        }
        log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${isPages ? 'Pages' : 'Workers'} configuration`)
      }

      // TODO: D1 migrations via wrangler migrations dir
      if (hub.applyDatabaseMigrationsDuringBuild) {
        hub.applyDatabaseMigrationsDuringBuild = false
        log.warn('Skipping database migrations - Currently Cloudflare is not supported')
      }
      break
    }

    default: {
      if (dialect === true) {
        throw new Error('Database dialect must be set in `hub.database`, or a production database connector must be set in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          connector: 'postgresql',
          options: {
            url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
          }
        }
        if (!process.env.POSTGRES_URL && !process.env.POSTGRESQL_URL && !process.env.DATABASE_URL) {
          log.info('Set `POSTGRES_URL`, `POSTGRESQL_URL`, or `DATABASE_URL` environment variable to configure PostgreSQL database')
          if (hub.applyDatabaseMigrationsDuringBuild) {
            hub.applyDatabaseMigrationsDuringBuild = false
            log.warn('Skipping database migrations - missing database environment variables')
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
          databaseConfig = {
            connector: 'libsql',
            options: {
              url: process.env.TURSO_DATABASE_URL,
              authToken: process.env.TURSO_AUTH_TOKEN
            }
          }
        } else {
          databaseConfig = {
            connector: 'sqlite',
            options: {
              path: '.data/database/sqlite/db.sqlite3'
            }
          }
        }
      }
      break
    }
  }

  if (databaseConfig!) {
    // set connector
    // @ts-expect-error temporarily set to empty object
    nitro.options.database ||= {}
    nitro.options.database.db = defu(nitro.options.database?.db, databaseConfig) as any
    log.info(`\`hubDatabase()\` configured with \`${databaseConfig.connector}\` driver`)
  }
}
