import { mkdir, copyFile, writeFile, readFile, stat } from 'node:fs/promises'
import chokidar from 'chokidar'
import { glob } from 'tinyglobby'
import { join, resolve as resolveFs, relative } from 'pathe'
import { defu } from 'defu'
import { addServerImports, addTemplate, addServerPlugin, addTypeTemplate, getLayerDirectories, updateTemplates, logger, addServerHandler } from '@nuxt/kit'
import { resolve, resolvePath, logWhenReady, addWranglerBinding } from '../utils'
import { copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir, copyDatabaseAssets, applyBuildTimeMigrations, getDatabaseSchemaPathMetadata, buildDatabaseSchema } from './lib'
import { cloudflareHooks } from '../hosting/cloudflare'
import { getAdapter } from './adapters/interface'
import type { HubDbAdapter } from './adapters/interface'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedHubConfig, ResolvedDatabaseConfig } from '@nuxthub/core'

const log = logger.withTag('nuxt:hub')

/**
 * Resolve database configuration from string or object format
 */
export async function resolveDatabaseConfig(nuxt: Nuxt, hub: HubConfig): Promise<ResolvedDatabaseConfig | false> {
  if (!hub.db) return false

  let config = typeof hub.db === 'string' ? { dialect: hub.db } : hub.db
  config = defu(config, {
    orm: 'drizzle',
    migrationsDirs: getLayerDirectories(nuxt).map(layer => join(layer.server, 'db/migrations')),
    queriesPaths: [],
    applyMigrationsDuringBuild: true
  })

  switch (config.dialect) {
    case 'sqlite': {
      // User explicitly set driver: 'libsql' - track for lazy env resolution
      const userExplicitLibsql = config.driver === 'libsql'

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
        }) as ResolvedDatabaseConfig['connection']
        if (!config.connection?.accountId || !config.connection?.apiToken || !config.connection?.databaseId) {
          throw new Error('D1 HTTP driver requires NUXT_HUB_CLOUDFLARE_ACCOUNT_ID, NUXT_HUB_CLOUDFLARE_API_TOKEN, and NUXT_HUB_CLOUDFLARE_DATABASE_ID environment variables')
        }
        break
      }
      // Cloudflare D1 (production only - dev/prepare uses local libsql)
      if (hub.hosting.includes('cloudflare') && !nuxt.options.dev && !nuxt.options._prepare) {
        config.driver = 'd1'
        break
      }
      // User explicitly set libsql without env vars - allow lazy resolution at runtime
      if (userExplicitLibsql) {
        config.connection = defu(config.connection, { url: '' })
        break
      }
      config.driver ||= 'libsql'
      config.connection = defu(config.connection, { url: `file:${join(hub.dir!, 'db/sqlite.db')}` })
      await mkdir(join(hub.dir, 'db'), { recursive: true })
      break
    }
    case 'postgresql': {
      // Cloudflare Hyperdrive with explicit hyperdriveId
      if (hub.hosting.includes('cloudflare') && config.connection?.hyperdriveId && !config.driver) {
        config.driver = 'postgres-js'
        break
      }
      config.connection = defu(config.connection, { url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL || '' })
      // Only error at build time if migrations need to run
      if (config.applyMigrationsDuringBuild && config.driver && ['neon-http', 'postgres-js'].includes(config.driver) && !config.connection.url) {
        throw new Error(`\`${config.driver}\` driver requires \`DATABASE_URL\`, \`POSTGRES_URL\`, or \`POSTGRESQL_URL\` environment variable when \`applyMigrationsDuringBuild\` is enabled`)
      }
      if (config.connection.url) {
        config.driver ||= 'postgres-js'
        break
      }
      config.driver ||= 'pglite'
      config.connection = defu(config.connection, { dataDir: join(hub.dir, 'db/pglite') })
      await mkdir(join(hub.dir, 'db/pglite'), { recursive: true })
      break
    }
    case 'mysql': {
      // Cloudflare Hyperdrive with explicit hyperdriveId
      if (hub.hosting.includes('cloudflare') && config.connection?.hyperdriveId && !config.driver) {
        config.driver = 'mysql2'
        break
      }
      config.driver ||= 'mysql2'
      config.connection = defu(config.connection, { uri: process.env.MYSQL_URL || process.env.DATABASE_URL || '' })
      // Only error at build time if migrations need to run
      if (config.applyMigrationsDuringBuild && !config.connection.uri) {
        throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable when `applyMigrationsDuringBuild` is enabled')
      }
      break
    }
    default: {
      throw new Error(`Unsupported database dialect: ${config.dialect}. Supported: sqlite, postgresql, mysql`)
    }
  }

  // Disable migrations if database connection is not supported in CI
  if (config.driver === 'd1') {
    config.applyMigrationsDuringBuild = false
  }

  return config as ResolvedDatabaseConfig
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>): Promise<void> {
  hub.db = await resolveDatabaseConfig(nuxt, hub)
  if (!hub.db) return

  const { orm, dialect, driver, connection, migrationsDirs, queriesPaths } = hub.db as ResolvedDatabaseConfig

  // Get the ORM adapter
  const adapter = await getAdapter(orm)

  logWhenReady(nuxt, `\`hub:db\` using \`${dialect}\` database with \`${driver}\` driver (${orm})`, 'info')

  if (driver === 'd1' && connection?.databaseId) {
    addWranglerBinding(nuxt, 'd1_databases', { binding: 'DB', database_id: connection.databaseId })
  }
  if (['postgres-js', 'mysql2'].includes(driver) && connection?.hyperdriveId) {
    const binding = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    addWranglerBinding(nuxt, 'hyperdrive', { binding, id: connection.hyperdriveId })
  }

  // Verify dependencies via adapter
  const missingDeps = adapter.checkMissingDeps(deps, driver)
  if (missingDeps.length > 0) {
    logWhenReady(nuxt, `Please run \`npx nypm i ${missingDeps.join(' ')}\` to properly setup ${orm} with NuxtHub.`, 'error')
  }

  // Add Server scanning
  addServerPlugin(resolve('db/runtime/plugins/migrations.dev'))

  // Handle migrations
  nuxt.hook('modules:done', async () => {
    // generate database schema (Drizzle only - Prisma uses its own schema format)
    if (orm === 'drizzle') {
      await generateDatabaseSchema(nuxt, hub as ResolvedHubConfig)
    }
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

  // Add D1 migrations settings to wrangler.json for Cloudflare deployments
  if (driver === 'd1') {
    cloudflareHooks.hook('wrangler:config', (config) => {
      const d1Databases = config.d1_databases as {
        binding: string
        database_id?: string
        migrations_table?: string
        migrations_dir?: string
      }[] | undefined

      if (!d1Databases?.length) return

      const dbBinding = d1Databases.find(db => db.binding === 'DB')
      if (dbBinding) {
        dbBinding.migrations_table ||= '_hub_migrations'
        dbBinding.migrations_dir ||= '.output/server/db/migrations/'
      }
    })
  }

  await setupDatabaseClient(nuxt, hub as ResolvedHubConfig, adapter)
  await setupDatabaseConfig(nuxt, hub as ResolvedHubConfig, adapter)
}

async function generateDatabaseSchema(nuxt: Nuxt, hub: ResolvedHubConfig) {
  if (!hub.db) return
  const dialect = hub.db.dialect

  const getSchemaPaths = async () => {
    const schemaPatterns = getLayerDirectories(nuxt).map(layer => [
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
    const watchDirs = getLayerDirectories(nuxt).map(layer => resolveFs(layer.server, 'db'))
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
      await buildDatabaseSchema(nuxt.options.buildDir, { relativeDir: nuxt.options.rootDir, alias: nuxt.options.alias })

      // Also copy to node_modules/@nuxthub/db/ for workflow compatibility
      const physicalDbDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'db')
      try {
        await copyFile(join(nuxt.options.buildDir, 'hub/db/schema.mjs'), join(physicalDbDir, 'schema.mjs'))
        await copyFile(join(nuxt.options.buildDir, 'hub/db/schema.d.mts'), join(physicalDbDir, 'schema.d.mts'))
      } catch (error) {
        // Ignore errors during watch
      }
    })
    nuxt.hook('close', () => watcher.close())
  }

  // Generate final database schema file at .nuxt/hub/db/schema.mjs
  addTemplate({
    filename: 'hub/db/schema.entry.ts',
    getContents: () => `${schemaPaths.map(path => `export * from '${path}'`).join('\n')}`,
    write: true
  })

  // Build schema types during prepare/dev/build, then copy to node_modules
  nuxt.hooks.hookOnce('app:templatesGenerated', async () => {
    await buildDatabaseSchema(nuxt.options.buildDir, { relativeDir: nuxt.options.rootDir, alias: nuxt.options.alias })

    // Then copy to node_modules/@nuxthub/db/ for workflow compatibility
    const physicalDbDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'db')
    await mkdir(physicalDbDir, { recursive: true })

    try {
      await copyFile(join(nuxt.options.buildDir, 'hub/db/schema.mjs'), join(physicalDbDir, 'schema.mjs'))

      // Copy the generated .d.mts file for TypeScript support
      // Try buildDir first, then fall back to .nuxt (for when buildDir is in .cache during build)
      const buildDirSource = join(nuxt.options.buildDir, 'hub/db/schema.d.mts')
      const nuxtDirSource = join(nuxt.options.rootDir, '.nuxt/hub/db/schema.d.mts')

      let schemaTypes: string | undefined
      try {
        schemaTypes = await readFile(buildDirSource, 'utf-8')
      } catch {
        // Fallback to .nuxt directory (types generated during prepare)
        try {
          schemaTypes = await readFile(nuxtDirSource, 'utf-8')
        } catch {
          // Types not found in either location
        }
      }

      if (schemaTypes && schemaTypes.length > 50) {
        await writeFile(join(physicalDbDir, 'schema.d.mts'), schemaTypes)
      } else if (!nuxt.options.test) {
        // Fallback: create a simple re-export if types not available
        await writeFile(join(physicalDbDir, 'schema.d.mts'), `export * from './schema.mjs'`)
      }
    } catch (error) {
      log.warn(`Failed to copy schema to node_modules/.hub/: ${error}`)
    }
  })

  nuxt.options.alias ||= {}
  // Create hub:db:schema alias to @nuxthub/db/schema for backwards compatibility
  addTypeTemplate({
    filename: 'hub/db/schema.d.ts',
    getContents: () => `declare module 'hub:db:schema' {
  export * from '#build/hub/db/schema.mjs'
}`
  }, { nitro: true, nuxt: true })
  nuxt.options.alias['hub:db:schema'] = '@nuxthub/db/schema'
}

async function setupDatabaseClient(nuxt: Nuxt, hub: ResolvedHubConfig, adapter: HubDbAdapter) {
  const dbConfig = hub.db as ResolvedDatabaseConfig
  const { orm, driver } = dbConfig

  const ctx = { nuxt, hub, dbConfig }

  // Setup Database Types via adapter
  const databaseTypes = adapter.getClientTypes(ctx)
  addTypeTemplate({
    filename: 'hub/db.d.ts',
    getContents: () => databaseTypes
  }, { nitro: true, nuxt: true })

  // Generate client code via adapter
  const clientCode = adapter.createClientCode(ctx)

  // For Drizzle with PGlite in dev, add the studio launch handler
  if (orm === 'drizzle' && driver === 'pglite' && nuxt.options.dev) {
    addServerHandler({
      handler: await resolvePath('db/runtime/api/launch-studio.post.dev'),
      method: 'post',
      route: '/api/_hub/db/launch-studio'
    })
  }

  const databaseTemplate = addTemplate({
    filename: 'hub/db.mjs',
    getContents: () => clientCode,
    write: true
  })
  nuxt.options.alias!['hub:db'] = databaseTemplate.dst
  addServerImports({ name: 'db', from: 'hub:db', meta: { description: `The ${orm} ${driver} database client.` } })

  // For Drizzle, also export the schema
  if (orm === 'drizzle') {
    addServerImports({ name: 'schema', from: 'hub:db', meta: { description: `The database schema object` } })
  }

  // Handle Prisma's prepare:types hook for client generation
  if (adapter.onPrepareTypes) {
    nuxt.hook('prepare:types', async () => {
      await adapter.onPrepareTypes!(ctx)
    })
  }
}

async function setupDatabaseConfig(nuxt: Nuxt, hub: ResolvedHubConfig, _adapter: HubDbAdapter) {
  const { orm, dialect, casing } = hub.db as ResolvedDatabaseConfig

  // Only generate drizzle.config.ts for Drizzle ORM
  if (orm === 'drizzle') {
    const casingConfig = casing ? `\n  casing: '${casing}',` : ''
    addTemplate({
      filename: 'hub/db/drizzle.config.ts',
      write: true,
      getContents: () => `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: '${dialect}',${casingConfig}
  schema: '${relative(nuxt.options.rootDir, resolve(nuxt.options.buildDir, 'hub/db/schema.mjs'))}',
  out: '${relative(nuxt.options.rootDir, resolve(nuxt.options.rootDir, `server/db/migrations/${dialect}`))}'
});` })
  }
}
