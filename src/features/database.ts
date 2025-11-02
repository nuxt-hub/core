import { mkdir } from 'node:fs/promises'
import chokidar from 'chokidar'
import { glob } from 'tinyglobby'
import { join, resolve as resolvePath } from 'pathe'
import { defu } from 'defu'
import { addServerImports, addServerImportsDir, addServerScanDir, addTemplate, addTypeTemplate, getLayerDirectories, updateTemplates, logger } from '@nuxt/kit'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir } from '../runtime/database/server/utils/migrations/helpers'
import { logWhenReady } from '../features'
import { resolve } from '../module'
import { getDatabasePathMetadata } from '../utils/database'

import type { Nuxt } from '@nuxt/schema'
import type { ResolvedDatabaseConfig, HubConfig, ResolvedHubConfig } from '../types'
import { relative } from 'node:path'

const log = logger.withTag('nuxt:hub')

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
        config.driver ||= 'postgres-js'
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

  const { dialect, driver, migrationsDirs, queriesPaths } = hub.database as ResolvedDatabaseConfig
  nuxt.options.nitro.alias ||= {}

  logWhenReady(nuxt, `\`hub:database\` using \`${dialect}\` database with \`${driver}\` driver`, 'info')

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
  addServerScanDir(resolve('runtime/database/server'))
  addServerImportsDir(resolve('runtime/database/server/utils'))

  // Handle migrations
  nuxt.hook('modules:done', async () => {
    // generate database schema
    await generateDatabaseSchema(nuxt, hub as ResolvedHubConfig)
    // Call hub:database:migrations:dirs hook
    await nuxt.callHook('hub:database:migrations:dirs', migrationsDirs)
    // Copy all migrations files to the hub.dir directory
    await copyDatabaseMigrationsToHubDir(hub as ResolvedHubConfig)
    // Call hub:database:queries:paths hook
    await nuxt.callHook('hub:database:queries:paths', queriesPaths)
    await copyDatabaseQueriesToHubDir(hub as ResolvedHubConfig)
  })

  await setupDatabaseClient(nuxt, hub as ResolvedHubConfig)
  await setupDatabaseConfig(nuxt, hub as ResolvedHubConfig)
}

async function generateDatabaseSchema(nuxt: Nuxt, hub: ResolvedHubConfig) {
  if (!hub.database) return
  const dialect = hub.database.dialect

  const getSchemaPaths = async () => {
    const schemaPatterns = getLayerDirectories().map(layer => [
      resolvePath(layer.server, 'database/schema.ts'),
      resolvePath(layer.server, `database/schema.${dialect}.ts`),
      resolvePath(layer.server, 'database/schema/*.ts')
    ]).flat()
    let schemaPaths = await glob(schemaPatterns, { absolute: true, onlyFiles: true })

    await nuxt.callHook('hub:database:schema:extend', { dialect, paths: schemaPaths })

    schemaPaths = schemaPaths.filter((path) => {
      const meta = getDatabasePathMetadata(path)
      return !meta.dialect || meta.dialect === dialect
    })
    return schemaPaths
  }

  // Export Drizzle global schema object including all schema files

  let schemaPaths = await getSchemaPaths()

  // Watch schema files for changes
  if (nuxt.options.dev && !nuxt.options._prepare) {
    // chokidar doesn't support glob patterns, so we need to watch the server/database directories
    const watchDirs = getLayerDirectories().map(layer => resolvePath(layer.server, 'database'))
    const watcher = chokidar.watch(watchDirs, {
      ignoreInitial: true
    })
    watcher.on('all', async (event, path) => {
      if (!path.endsWith('database/schema.ts') && !path.endsWith(`database/schema.${dialect}.ts`) && !path.includes('/database/schema/')) return
      if (['add', 'unlink'].includes(event) === false) return
      const meta = getDatabasePathMetadata(path)
      if (meta.dialect && meta.dialect !== dialect) return
      log.info(`Database schema ${event === 'add' ? 'added' : 'removed'}: \`${relative(nuxt.options.rootDir, path)}\``)
      // log.info('Make sure to run `npx nuxt hub database generate` to generate the database migrations.')
      schemaPaths = await getSchemaPaths()
      await updateTemplates({ filter: template => template.filename.includes('hub/database/schema.mjs') })
    })
    nuxt.hook('close', () => watcher.close())
  }

  // Add schema template into .nuxt/hub/database/schema.mjs
  const schemaTemplate = addTemplate({
    filename: 'hub/database/schema.mjs',
    getContents: () => `${schemaPaths.map(path => `export * from '${path}'`).join('\n')}`,
    write: true
  })
  addTypeTemplate({
    filename: 'hub/database/schema.d.ts',
    write: true,
    getContents: () => `export * from './schema.mjs'`
  }, { shared: true })

  nuxt.options.alias ||= {}
  nuxt.options.alias['hub:database:schema'] = schemaTemplate.dst
}

async function setupDatabaseClient(nuxt: Nuxt, hub: ResolvedHubConfig) {
  const { driver, connection } = hub.database as ResolvedDatabaseConfig

  // Setup Database Types
  const databaseTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driver}'
import * as schema from './database/schema.mjs'

declare module 'hub:database' {
  /**
   * The database schema object
   * Defined in server/database/schema.ts and server/database/schema/*.ts
   */
  export * as schema from './database/schema.mjs'
  /**
   * The ${driver} database client.
   */
  export const db: ReturnType<typeof drizzleCore<typeof schema>>
}`

  addTypeTemplate({
    filename: 'hub/database.d.ts',
    getContents: () => databaseTypes
  }, { nitro: true })

  // Setup Drizzle ORM

  // Generate simplified drizzle() implementation
  let drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${driver}'
import * as schema from './database/schema.mjs'

const db = drizzle({ connection: ${JSON.stringify(connection)}, schema })
export { db, schema }
`

  if (driver === 'pglite' && nuxt.options.dev) {
    // PGlite instance exported for use in devtools Drizzle Studio
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import * as schema from './database/schema.mjs'

const client = new PGlite(${JSON.stringify(connection.dataDir)})
const db = drizzle({ client, schema })
export { db, schema, client }
`

    addServerScanDir(resolve('runtime/database/pglite-server'))
  }
  if (driver === 'postgres-js' && nuxt.options.dev) {
    // disable notice logger for postgres-js in dev
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres('${connection.url}', {
  onnotice: () => {}
})
const db = drizzle({ client });
export { db, schema }
`
  }

  if (driver === 'd1') {
    // D1 requires binding from environment
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/d1'
import * as schema from './database/schema.mjs'

const binding = process.env.DB || globalThis.DB
const db = drizzle(binding, { schema })
export { db, schema }
`
  }
  if (['postgres-js', 'mysql2'].includes(driver) && hub.hosting.includes('cloudflare')) {
    const bindingName = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${driver}'
import * as schema from './database/schema.mjs'

const hyperdrive = process.env.${bindingName} || globalThis.__env__?.${bindingName} || globalThis.${bindingName}
const db = drizzle({ connection: hyperdrive.connectionString, schema })
export { db, schema }
`
  }

  const databaseTemplate = addTemplate({
    filename: 'hub/database.mjs',
    getContents: () => drizzleOrmContent,
    write: true
  })
  nuxt.options.nitro.alias!['hub:database'] = databaseTemplate.dst
  addServerImports({ name: 'db', from: 'hub:database', meta: { description: `The ${driver} database client.` } })
  addServerImports({ name: 'schema', from: 'hub:database', meta: { description: `The database schema object` } })
}

async function setupDatabaseConfig(nuxt: Nuxt, hub: ResolvedHubConfig) {
  // generate drizzle.config.ts in .nuxt/hub/database/drizzle.config.ts
  const { dialect } = hub.database as ResolvedDatabaseConfig
  addTemplate({
    filename: 'hub/database/drizzle.config.ts',
    write: true,
    getContents: () => `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: '${dialect}',
  schema: '${relative(nuxt.options.rootDir, resolve(nuxt.options.buildDir, 'hub/database/schema.mjs'))}',
  out: '${relative(nuxt.options.rootDir, resolve(nuxt.options.rootDir, `server/database/migrations/${dialect}`))}'
});` })
}
