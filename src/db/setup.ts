import { mkdir } from 'node:fs/promises'
import chokidar from 'chokidar'
import { glob } from 'tinyglobby'
import { join, resolve as resolveFs } from 'pathe'
import { defu } from 'defu'
import { addServerImports, addTemplate, addServerPlugin, addTypeTemplate, getLayerDirectories, updateTemplates, logger, addServerHandler } from '@nuxt/kit'
import { resolve, resolvePath, logWhenReady } from '../utils'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir, copyDatabaseAssets, applyBuildTimeMigrations, getDatabaseSchemaPathMetadata, buildDatabaseSchema } from './lib'

import type { Nuxt } from '@nuxt/schema'
import type { ResolvedDatabaseConfig } from './types/index'
import type { HubConfig, ResolvedHubConfig } from '../types/module'
import { relative } from 'node:path'

const log = logger.withTag('nuxt:hub')

/**
 * Resolve database configuration from string or object format
 */
export async function resolveDatabaseConfig(nuxt: Nuxt, hub: HubConfig): Promise<ResolvedDatabaseConfig | false> {
  if (!hub.db) return false

  let config = typeof hub.db === 'string' ? { dialect: hub.db } : hub.db
  config = defu(config, {
    migrationsDirs: nuxt.options._layers?.map(layer => join(layer.config.serverDir!, 'db/migrations')).filter(Boolean),
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
      // Cloudflare D1 over HTTP
      if (config.driver === 'd1-http') {
        config.connection = defu(config.connection, {
          accountId: process.env.NUXT_HUB_CLOUDFLARE_ACCOUNT_ID || undefined,
          apiToken: process.env.NUXT_HUB_CLOUDFLARE_API_TOKEN || undefined,
          databaseId: process.env.NUXT_HUB_CLOUDFLARE_DATABASE_ID || undefined
        }) as DatabaseConnection
        if (!config.connection?.accountId || !config.connection?.apiToken || !config.connection?.databaseId) {
          throw new Error('D1 HTTP driver requires NUXT_HUB_CLOUDFLARE_ACCOUNT_ID, NUXT_HUB_CLOUDFLARE_API_TOKEN, and NUXT_HUB_CLOUDFLARE_DATABASE_ID environment variables')
        }
        break
      }
      // Cloudflare D1
      if (hub.hosting.includes('cloudflare')) {
        config.driver = 'd1'
        break
      }
      // Local SQLite
      config.driver ||= 'libsql'
      config.connection = defu(config.connection, { url: `file:${join(hub.dir!, 'db/sqlite.db')}` })
      await mkdir(join(hub.dir, 'db'), { recursive: true })
      break
    }
    case 'postgresql': {
      config.connection = defu(config.connection, { url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL || '' })
      if (config.connection.url) {
        config.driver ||= 'postgres-js'
        break
      }
      // Local PGLite
      config.driver ||= 'pglite'
      config.connection = defu(config.connection, { dataDir: join(hub.dir, 'db/pglite') })
      await mkdir(join(hub.dir, 'db/pglite'), { recursive: true })
      break
    }
    case 'mysql': {
      config.driver ||= 'mysql2'
      config.connection = defu(config.connection, { uri: process.env.MYSQL_URL || process.env.DATABASE_URL || '' })
      if (!config.connection.uri) {
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
  hub.db = await resolveDatabaseConfig(nuxt, hub)
  if (!hub.db) return

  const { dialect, driver, migrationsDirs, queriesPaths } = hub.db as ResolvedDatabaseConfig
  nuxt.options.nitro.alias ||= {}

  logWhenReady(nuxt, `\`hub:db\` using \`${dialect}\` database with \`${driver}\` driver`, 'info')

  // Verify development database dependencies are installed
  if (!deps['drizzle-orm'] || !deps['drizzle-kit']) {
    logWhenReady(nuxt, 'Please run `npx nypm i drizzle-orm drizzle-kit` to properly setup Drizzle ORM with NuxtHub.', 'error')
  }
  if (driver === 'postgres-js' && !deps['postgres']) {
    logWhenReady(nuxt, 'Please run `npx nypm i postgres` to use PostgreSQL as database.', 'error')
  } else if (driver === 'pglite' && !deps['@electric-sql/pglite']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @electric-sql/pglite` to use PGlite as database.', 'error')
  } else if (driver === 'mysql2' && !deps.mysql2) {
    logWhenReady(nuxt, 'Please run `npx nypm i mysql2` to use MySQL as database.', 'error')
  } else if (driver === 'libsql' && !deps['@libsql/client']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @libsql/client` to use SQLite as database.', 'error')
  }

  // Add Server scanning
  addServerPlugin(resolve('db/runtime/plugins/migrations.dev'))

  // Handle migrations
  nuxt.hook('modules:done', async () => {
    // generate database schema
    await generateDatabaseSchema(nuxt, hub as ResolvedHubConfig)
    // Call hub:db:migrations:dirs hook
    await nuxt.callHook('hub:db:migrations:dirs', migrationsDirs)
    // Copy all migrations files to the hub.dir directory
    await copyDatabaseMigrationsToHubDir(hub as ResolvedHubConfig)
    // Call hub:db:queries:paths hook
    await nuxt.callHook('hub:db:queries:paths', queriesPaths, dialect)
    await copyDatabaseQueriesToHubDir(hub as ResolvedHubConfig)
  })

  // Copy database assets to public directory during build
  nuxt.hook('nitro:build:public-assets', async (nitro) => {
    // Database migrations & queries
    await copyDatabaseAssets(nitro, hub as ResolvedHubConfig)
    await applyBuildTimeMigrations(nitro, hub as ResolvedHubConfig)
  })

  await setupDatabaseClient(nuxt, hub as ResolvedHubConfig)
  await setupDatabaseConfig(nuxt, hub as ResolvedHubConfig)
}

async function generateDatabaseSchema(nuxt: Nuxt, hub: ResolvedHubConfig) {
  if (!hub.db) return
  const dialect = hub.db.dialect

  const getSchemaPaths = async () => {
    const schemaPatterns = getLayerDirectories().map(layer => [
      resolveFs(layer.server, 'db/schema.ts'),
      resolveFs(layer.server, `db/schema.${dialect}.ts`),
      resolveFs(layer.server, 'db/schema/*.ts')
    ]).flat()
    let schemaPaths = await glob(schemaPatterns, { absolute: true, onlyFiles: true })

    await nuxt.callHook('hub:db:schema:extend', { dialect, paths: schemaPaths })

    schemaPaths = schemaPaths.filter((path) => {
      const meta = getDatabaseSchemaPathMetadata(path)
      return !meta.dialect || meta.dialect === dialect
    })
    return schemaPaths
  }

  // Export Drizzle global schema object including all schema files

  let schemaPaths = await getSchemaPaths()

  // Watch schema files for changes
  if (nuxt.options.dev && !nuxt.options._prepare) {
    // chokidar doesn't support glob patterns, so we need to watch the server/db directories
    const watchDirs = getLayerDirectories().map(layer => resolveFs(layer.server, 'db'))
    const watcher = chokidar.watch(watchDirs, {
      ignoreInitial: true
    })
    watcher.on('all', async (event, path) => {
      if (!path.endsWith('db/schema.ts') && !path.endsWith(`db/schema.${dialect}.ts`) && !path.includes('/db/schema/')) return
      if (['add', 'unlink', 'change'].includes(event) === false) return
      const meta = getDatabaseSchemaPathMetadata(path)
      if (meta.dialect && meta.dialect !== dialect) return
      log.info(`Database schema ${event === 'add' ? 'added' : event === 'unlink' ? 'removed' : 'changed'}: \`${relative(nuxt.options.rootDir, path)}\``)
      log.info('Make sure to run `npx nuxt db generate` to generate the database migrations.')
      schemaPaths = await getSchemaPaths()
      await updateTemplates({ filter: template => template.filename.includes('hub/db/schema.entry.ts') })
      await buildDatabaseSchema(nuxt.options.buildDir, { relativeDir: nuxt.options.rootDir })
    })
    nuxt.hook('close', () => watcher.close())
  }

  // Generate final database schema file at .nuxt/hub/db/schema.mjs
  addTemplate({
    filename: 'hub/db/schema.entry.ts',
    getContents: () => `${schemaPaths.map(path => `export * from '${path}'`).join('\n')}`,
    write: true
  })
  if (!nuxt.options._prepare) {
    nuxt.hooks.hookOnce('app:templatesGenerated', async () => {
      await buildDatabaseSchema(nuxt.options.buildDir, { relativeDir: nuxt.options.rootDir })
    })
  }

  nuxt.options.alias ||= {}
  nuxt.options.alias['hub:db:schema'] = join(nuxt.options.buildDir, 'hub/db/schema.mjs')
}

async function setupDatabaseClient(nuxt: Nuxt, hub: ResolvedHubConfig) {
  const { driver, connection } = hub.db as ResolvedDatabaseConfig

  // For types, d1-http uses sqlite-proxy
  const driverForTypes = driver === 'd1-http' ? 'sqlite-proxy' : driver

  // Setup Database Types
  const databaseTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driverForTypes}'
import * as schema from './db/schema.mjs'

declare module 'hub:db' {
  /**
   * The database schema object
   * Defined in server/db/schema.ts and server/db/schema/*.ts
   */
  export * as schema from './db/schema.mjs'
  /**
   * The ${driver} database client.
   */
  export const db: ReturnType<typeof drizzleCore<typeof schema>>
}`

  addTypeTemplate({
    filename: 'hub/db.d.ts',
    getContents: () => databaseTypes
  }, { nitro: true })

  // Setup Drizzle ORM

  // Generate simplified drizzle() implementation
  let drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${driver}'
import * as schema from './db/schema.mjs'

const db = drizzle({ connection: ${JSON.stringify(connection)}, schema })
export { db, schema }
`

  if (driver === 'pglite' && nuxt.options.dev) {
    // PGlite instance exported for use in devtools Drizzle Studio
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import * as schema from './db/schema.mjs'

const client = new PGlite(${JSON.stringify(connection.dataDir)})
const db = drizzle({ client, schema })
export { db, schema, client }
`

    addServerHandler({
      handler: await resolvePath('db/runtime/api/launch-studio.post.dev'),
      method: 'post',
      route: '/api/_hub/db/launch-studio'
    })
  }
  if (driver === 'postgres-js' && nuxt.options.dev) {
    // disable notice logger for postgres-js in dev
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db/schema.mjs'

const client = postgres('${connection.url}', {
  onnotice: () => {}
})
const db = drizzle({ client, schema });
export { db, schema }
`
  }

  if (driver === 'd1') {
    // D1 requires binding from environment
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema.mjs'

const binding = process.env.DB || globalThis.DB
const db = drizzle(binding, { schema })
export { db, schema }
`
  }
  if (driver === 'd1-http') {
    // D1 over HTTP using sqlite-proxy
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from './db/schema.mjs'

const accountId = ${JSON.stringify(connection.accountId)}
const databaseId = ${JSON.stringify(connection.databaseId)}
const apiToken = ${JSON.stringify(connection.apiToken)}

async function d1HttpDriver(sql, params, method) {
  if (method === 'values') method = 'all'

  const { errors, success, result } = await $fetch(\`https://api.cloudflare.com/client/v4/accounts/\${accountId}/d1/db/\${databaseId}/raw\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${apiToken}\`,
      'Content-Type': 'application/json'
    },
    async onResponseError({ request, response, options }) {
      console.error(
        "D1 HTTP Error:",
        request,
        options.body,
        response.status,
        response._data,
      )
    },
    body: { sql, params }
  })

  if (errors?.length > 0 || !success) {
    throw new Error(\`D1 HTTP error: \${JSON.stringify({ errors, success, result })}\`)
  }

  const queryResult = result?.[0]
  if (!queryResult?.success) {
    throw new Error(\`D1 HTTP error: \${JSON.stringify({ errors, success, result })}\`)
  }

  const rows = queryResult.results?.rows || []

  if (method === 'get') {
    if (rows.length === 0) {
      return { rows: [] }
    }
    return { rows: rows[0] }
  }

  return { rows }
}

const db = drizzle(d1HttpDriver, { schema })

export { db, schema }
`
  }
  if (['postgres-js', 'mysql2'].includes(driver) && hub.hosting.includes('cloudflare')) {
    const bindingName = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${driver}'
import * as schema from './db/schema.mjs'

const hyperdrive = process.env.${bindingName} || globalThis.__env__?.${bindingName} || globalThis.${bindingName}
const db = drizzle({ connection: hyperdrive.connectionString, schema })
export { db, schema }
`
  }

  const databaseTemplate = addTemplate({
    filename: 'hub/db.mjs',
    getContents: () => drizzleOrmContent,
    write: true
  })
  nuxt.options.nitro.alias!['hub:db'] = databaseTemplate.dst
  addServerImports({ name: 'db', from: 'hub:db', meta: { description: `The ${driver} database client.` } })
  addServerImports({ name: 'schema', from: 'hub:db', meta: { description: `The database schema object` } })
}

async function setupDatabaseConfig(nuxt: Nuxt, hub: ResolvedHubConfig) {
  // generate drizzle.config.ts in .nuxt/hub/db/drizzle.config.ts
  const { dialect } = hub.db as ResolvedDatabaseConfig
  addTemplate({
    filename: 'hub/db/drizzle.config.ts',
    write: true,
    getContents: () => `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: '${dialect}',
  schema: '${relative(nuxt.options.rootDir, resolve(nuxt.options.buildDir, 'hub/db/schema.mjs'))}',
  out: '${relative(nuxt.options.rootDir, resolve(nuxt.options.rootDir, `server/db/migrations/${dialect}`))}'
});` })
}
