import { addServerHandler, addServerImports, addServerPlugin, addTemplate, addTypeTemplate, getLayerDirectories, logger, updateTemplates } from '@nuxt/kit'
import chokidar from 'chokidar'
import { defu } from 'defu'
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve as resolveFs } from 'pathe'
import { glob } from 'tinyglobby'
import { cloudflareHooks } from '../hosting/cloudflare'
import { addWranglerBinding, logWhenReady, resolve, resolvePath } from '../utils'
import { applyBuildTimeMigrations, buildDatabaseSchema, copyDatabaseAssets, copyDatabaseMigrationsToHubDir, copyDatabaseQueriesToHubDir, getDatabaseSchemaPathMetadata } from './lib'

import type { Nuxt } from '@nuxt/schema'
import type { DatabaseConfig, HubConfig, ResolvedDatabaseConfig, ResolvedHubConfig } from '@nuxthub/core'

const log = logger.withTag('nuxt:hub')

/**
 * Generate a lazy-initialized db template with Proxy wrapper
 * Used for runtime env resolution (Docker/multi-deploy) and CF bindings
 */
function generateLazyDbTemplate(imports: string, getDbBody: string, options?: { schemaExport?: string, relationExport?: string }): string {
  const { relationExport = '' } = options || {}
  return `${imports}
import * as schema from './db/schema.mjs'

let _db
function getDb() {
  if (!_db) {
    try {
${getDbBody}
    } catch (e) { throw new Error('[nuxt-hub] ' + e.message) }
  }
  return _db
}
const db = new Proxy({}, { get(_, prop) { return getDb()[prop] } })
export { db, schema${relationExport} }
`
}

/**
 * Resolve database configuration from string or object format
 */
export async function resolveDatabaseConfig(nuxt: Nuxt, hub: HubConfig): Promise<ResolvedDatabaseConfig | false> {
  if (!hub.db) return false

  let config: DatabaseConfig = typeof hub.db === 'string' ? { dialect: hub.db } : hub.db
  config = defu(config, {
    migrationsDirs: getLayerDirectories(nuxt).map(layer => join(layer.server, 'db/migrations')),
    queriesPaths: [],
    applyMigrationsDuringBuild: true,
    applyMigrationsDuringDev: true,
    useRelationsV2: false
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
      // Cloudflare D1 via binding - explicit driver setting
      // In dev mode, set `driver: 'd1'` explicitly to enable D1 binding (for wrangler dev)
      if (config.driver === 'd1') {
        break
      }
      // Cloudflare D1 (production only - dev uses local libsql by default)
      if (hub.hosting.includes('cloudflare') && !nuxt.options.dev) {
        config.driver = 'd1'
        break
      }
      // User explicitly set libsql (e.g. Turso with inline config)
      if (userExplicitLibsql) {
        config.connection = defu(config.connection, { url: '' })
        break
      }
      // Cloudflare D1 (production only - dev/prepare uses local libsql)
      if (hub.hosting.includes('cloudflare') && !nuxt.options.dev && !nuxt.options._prepare) {
        config.driver = 'd1'
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
  }

  // Disable migrations if database connection is not supported in CI
  if (config.driver === 'd1') {
    config.applyMigrationsDuringBuild = false
  }

  return config as ResolvedDatabaseConfig
}

export async function setupDatabase(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  const userSetRelationsV2 = typeof hub.db === 'object' && hub.db && 'useRelationsV2' in hub.db
  hub.db = await resolveDatabaseConfig(nuxt, hub)
  if (!hub.db) return

  // Auto-enable useRelationsV2 when drizzle-orm v1+ is detected and user hasn't explicitly set it
  if (!userSetRelationsV2 && deps['drizzle-orm']) {
    const majorVersion = Number(deps['drizzle-orm']?.match(/\d/)?.[0])
    if (majorVersion >= 1) {
      (hub.db as ResolvedDatabaseConfig).useRelationsV2 = true
    }
  }

  const { dialect, driver, connection, migrationsDirs, queriesPaths, useRelationsV2 } = hub.db as ResolvedDatabaseConfig

  logWhenReady(nuxt, `\`hub:db\` using \`${dialect}\` database with \`${driver}\` driver`, 'info')

  if (driver === 'd1' && connection?.databaseId) {
    addWranglerBinding(nuxt, 'd1_databases', { binding: 'DB', database_id: connection.databaseId })
  }
  if (['postgres-js', 'mysql2'].includes(driver) && connection?.hyperdriveId) {
    const binding = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    addWranglerBinding(nuxt, 'hyperdrive', { binding, id: connection.hyperdriveId })
  }

  // Verify development database dependencies are installed
  if (!deps['drizzle-orm'] || !deps['drizzle-kit']) {
    logWhenReady(nuxt, 'Please run `npx nypm i drizzle-orm drizzle-kit` to properly setup Drizzle ORM with NuxtHub.', 'error')
  }
  if (driver === 'postgres-js' && !deps['postgres']) {
    logWhenReady(nuxt, 'Please run `npx nypm i postgres` to use PostgreSQL as database.', 'error')
  } else if (driver === 'neon-http' && !deps['@neondatabase/serverless']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @neondatabase/serverless` to use Neon serverless database.', 'error')
  } else if (driver === 'pglite' && !deps['@electric-sql/pglite']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @electric-sql/pglite` to use PGlite as database.', 'error')
  } else if (driver === 'mysql2' && !deps.mysql2) {
    logWhenReady(nuxt, 'Please run `npx nypm i mysql2` to use MySQL as database.', 'error')
  } else if (driver === 'libsql' && !deps['@libsql/client']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @libsql/client` to use SQLite as database.', 'error')
  }
  if (useRelationsV2 && Number(deps['drizzle-orm']?.match(/\d/)?.[0]) < 1) {
    logWhenReady(nuxt, '"useRelationsV2" requires drizzle-orm@1.0.0-beta or higher', 'error')
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
        dbBinding.migrations_dir ||= 'db/migrations/sqlite/'
      }
    })
  }

  if (useRelationsV2) await generateRelations(nuxt, hub as ResolvedHubConfig)
  await setupDatabaseClient(nuxt, hub as ResolvedHubConfig)
  await setupDatabaseConfig(nuxt, hub as ResolvedHubConfig)
}

async function generateRelations(nuxt: Nuxt, hub: ResolvedHubConfig) {
  if (!hub.db) return

  const physicalDbDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'db')
  await mkdir(physicalDbDir, { recursive: true })

  const relationsTypes = `
import type { ExtractTablesFromSchema, ExtractTablesWithRelationsParts, IncludeEveryTable } from 'drizzle-orm'
import * as schema from './schema.mjs'

type SchemaType = typeof schema
export type Tables = ExtractTablesFromSchema<SchemaType>
type RelationsKeys = keyof SchemaType extends infer Key ?  Key extends keyof SchemaType ?  SchemaType[Key] extends ExtractTablesWithRelationsParts<any, any> ?  Key : never : never : never
type FlatRelations = { [Key in keyof SchemaType[RelationsKeys]]: keyof SchemaType extends infer T ? T extends keyof SchemaType ? Key extends keyof SchemaType[T] ? SchemaType[T][Key] : never : never : never }
export type Relations = ExtractTablesWithRelationsParts<IncludeEveryTable<Tables>, Tables> & FlatRelations

export const relations: Relations
  `

  await writeFile(join(physicalDbDir, 'relations.d.mts'), relationsTypes)

  const relations = `
import { extractTablesFromSchema, defineRelationsPart } from 'drizzle-orm'
import * as schema from './schema.mjs'

const tables = extractTablesFromSchema(schema)
const tablesKeys = new Set(Object.keys(tables))
const isRelation = (obj) => typeof obj === 'object' && 'table' in obj && 'relations' in obj
export const relations = Object.keys(schema)
  .filter(key => !(key in tables))
  .map(key => schema[key])
  .filter(entry => Object.entries(entry).every(([key, val]) => tablesKeys.has(key) && isRelation(val)))
  .reduce((acc, entry) => {
    for (const [tbl, rels] of Object.entries(entry)) acc[tbl] = { ...acc[tbl], ...rels }
    return acc
  }, defineRelationsPart(schema))
  `
  await writeFile(join(physicalDbDir, 'relations.mjs'), relations)
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

    const extendedPaths: string[] = []
    await nuxt.callHook('hub:db:schema:extend', { dialect, paths: extendedPaths })

    // Order is important, if we have extendedPaths last, we may reference columns in relations that do not yet exist
    schemaPaths = [extendedPaths, schemaPaths].flat().filter((path) => {
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

async function setupDatabaseClient(nuxt: Nuxt, hub: ResolvedHubConfig) {
  const { dialect, driver, connection, mode, casing, replicas, useRelationsV2 } = hub.db as ResolvedDatabaseConfig

  // For types, d1-http uses sqlite-proxy
  const driverForTypes = driver === 'd1-http' ? 'sqlite-proxy' : driver

  // Setup Database Types for hub:db - point to @nuxthub/db for type definitions
  const databaseTypes = `declare module 'hub:db' {
  export * from '@nuxthub/db'
}`

  addTypeTemplate({
    filename: 'hub/db.d.ts',
    getContents: () => databaseTypes
  }, { nitro: true, nuxt: true })

  // Setup Drizzle ORM

  // Generate simplified drizzle() implementation
  const modeOption = dialect === 'mysql' && !useRelationsV2 ? `, mode: '${mode || 'default'}'` : ''
  const relationsImport = !useRelationsV2 ? '' : `\nimport { relations } from './db/relations.mjs'`
  const relationsOption = !useRelationsV2 ? '' : ', relations'
  const relationExport = !useRelationsV2 ? '' : ', relations'
  const casingOption = casing ? `, casing: '${casing}'` : ''
  let drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${driver}'${relationsImport}
import * as schema from './db/schema.mjs'

const db = drizzle({ connection: ${JSON.stringify(connection)}, schema${modeOption}${casingOption}${relationsOption} })
export { db, schema${relationExport} }
`

  if (driver === 'pglite' && nuxt.options.dev) {
    // PGlite instance exported for use in devtools Drizzle Studio
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'${relationsImport}
import * as schema from './db/schema.mjs'

const client = new PGlite(${JSON.stringify(connection.dataDir)})
const db = drizzle({ client, schema${casingOption}${relationsOption} })
export {db, schema${relationExport}, client }
`

    addServerHandler({
      handler: await resolvePath('db/runtime/api/launch-studio.post.dev'),
      method: 'post',
      route: '/api/_hub/db/launch-studio'
    })
  }
  // Add server handler for D1 binding in dev mode (for wrangler dev)
  if (driver === 'd1' && nuxt.options.dev) {
    addServerHandler({
      handler: await resolvePath('db/runtime/api/launch-studio.post.dev'),
      method: 'post',
      route: '/api/_hub/db/launch-studio'
    })
  }
  if (driver === 'postgres-js' && nuxt.options.dev) {
    // disable notice logger for postgres-js in dev
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/postgres-js'
${hasReplicas ? `import { withReplicas } from 'drizzle-orm/pg-core'\n` : ''}import postgres from 'postgres'${relationsImport}
import * as schema from './db/schema.mjs'

const client = postgres('${connection.url}', { onnotice: () => {} })
${hasReplicas
  ? `const primary = drizzle({ client, schema${casingOption}${relationsOption} })

const replicaUrls = ${JSON.stringify(replicaUrls)}
const replicaConnections = replicaUrls.map(replicaUrl => {
  const replicaClient = postgres(replicaUrl, { onnotice: () => {} })
  return drizzle({ client: replicaClient, schema${casingOption}${relationsOption} })
})
const db = withReplicas(primary, replicaConnections)`
  : `const db = drizzle({ client, schema${casingOption}${relationsOption} })`}
export {db, schema${relationExport} }
`
  }
  if (driver === 'mysql2' && nuxt.options.dev) {
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    if (hasReplicas) {
      drizzleOrmContent = `import { drizzle } from 'drizzle-orm/mysql2'${relationsImport}
import { withReplicas } from 'drizzle-orm/mysql-core'
import * as schema from './db/schema.mjs'

const primary = drizzle({ connection: ${JSON.stringify(connection)}, schema${modeOption}${casingOption}${relationsOption} })

const replicaUrls = ${JSON.stringify(replicaUrls)}
const replicaConnections = replicaUrls.map(replicaUrl => {
  return drizzle({ connection: { uri: replicaUrl }, schema${modeOption}${casingOption}${relationsOption} })
})
const db = withReplicas(primary, replicaConnections)
export {db, schema${relationExport} }
`
    }
  }
  if (driver === 'neon-http') {
    const urlExpr = connection.url ? `'${connection.url}'` : `process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL`
    drizzleOrmContent = generateLazyDbTemplate(
      `import { neon } from '@neondatabase/serverless'\nimport { drizzle } from 'drizzle-orm/neon-http'${relationsImport}`,
      `    const url = ${urlExpr}
    if (!url) throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRESQL_URL required')
    const sql = neon(url)
    _db = drizzle(sql, { ${casingOption}${relationsOption} })`,
      { relationExport }
    )
  }
  if (driver === 'd1') {
    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/d1'${relationsImport}`,
      `    const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
    if (!binding) throw new Error('DB binding not found')
    _db = drizzle(binding, { ${casingOption}${relationsOption} })`,
      { relationExport }
    )
  }
  if (driver === 'd1-http') {
    // D1 over HTTP using sqlite-proxy
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/sqlite-proxy'${relationsImport}
import * as schema from './db/schema.mjs'

const accountId = ${JSON.stringify(connection.accountId)}
const databaseId = ${JSON.stringify(connection.databaseId)}
const apiToken = ${JSON.stringify(connection.apiToken)}

async function d1HttpDriver(sql, params, method) {
  if (method === 'values') method = 'all'

  const { errors, success, result } = await $fetch(\`https://api.cloudflare.com/client/v4/accounts/\${accountId}/d1/database/\${databaseId}/raw\`, {
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

const db = drizzle(d1HttpDriver, { ${casingOption}${relationsOption} })

export {db, schema${relationExport} }
`
  }
  if (['postgres-js', 'mysql2'].includes(driver) && hub.hosting.includes('cloudflare') && connection?.hyperdriveId) {
    const bindingName = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/${driver}'${relationsImport}`,
      `    const hyperdrive = process.env.${bindingName} || globalThis.__env__?.${bindingName} || globalThis.${bindingName}
    if (!hyperdrive) throw new Error('${bindingName} binding not found')
    _db = drizzle({ connection: hyperdrive.connectionString, schema${modeOption}${casingOption}${relationsOption} })`,
      { relationExport }
    )
  }
  // Non-CF postgres-js: lazy env resolution for Docker/multi-deploy scenarios
  if (driver === 'postgres-js' && !nuxt.options.dev && !hub.hosting.includes('cloudflare')) {
    const urlExpr = connection.url ? `'${connection.url}'` : `process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL`
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/postgres-js'
${hasReplicas ? `import { withReplicas } from 'drizzle-orm/pg-core'\n` : ''}import postgres from 'postgres'${relationsImport}`,
      `    const url = ${urlExpr}
    if (!url) throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRESQL_URL required')
    const client = postgres(url, { onnotice: () => {} })
${hasReplicas
  ? `    const primary = drizzle({ client, schema${casingOption}${relationsOption} })

    const replicaUrls = ${JSON.stringify(replicaUrls)}
    const replicaConnections = replicaUrls.map(replicaUrl => {
      const replicaClient = postgres(replicaUrl, { onnotice: () => {} })
      return drizzle({ client: replicaClient, schema${casingOption}${relationsOption} })
    })
    _db = withReplicas(primary, replicaConnections)`
  : `    _db = drizzle({ client, schema${casingOption}${relationsOption} })`}`,
      { relationExport }
    )
  }
  // Non-CF mysql2: lazy env resolution for Docker/multi-deploy scenarios
  if (driver === 'mysql2' && !nuxt.options.dev && !hub.hosting.includes('cloudflare')) {
    const uriExpr = connection.uri ? `'${connection.uri}'` : `process.env.MYSQL_URL || process.env.DATABASE_URL`
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/mysql2'${hasReplicas ? `\nimport { withReplicas } from 'drizzle-orm/mysql-core'` : ''}${relationsImport}`,
      `    const uri = ${uriExpr}
    if (!uri) throw new Error('DATABASE_URL or MYSQL_URL required')
${hasReplicas
  ? `    const primary = drizzle({ connection: { uri }, schema${modeOption}${casingOption}${relationsOption} })

    const replicaUrls = ${JSON.stringify(replicaUrls)}
    const replicaConnections = replicaUrls.map(replicaUrl => {
      return drizzle({ connection: { uri: replicaUrl }, schema${modeOption}${casingOption}${relationsOption} })
    })
    _db = withReplicas(primary, replicaConnections)`
  : `    _db = drizzle({ connection: { uri }, schema${modeOption}${casingOption}${relationsOption} })`}`,
      { relationExport }
    )
  }
  // libsql: lazy env resolution for Docker/multi-deploy scenarios (when no URL baked in)
  if (driver === 'libsql' && !connection.url) {
    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/libsql'${relationsImport}`,
      `    const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN
    if (!url) throw new Error('Database URL not found. Set TURSO_DATABASE_URL, LIBSQL_URL, or DATABASE_URL')
    _db = drizzle({ connection: { url, authToken }, schema${casingOption}${relationsOption} })`,
      { relationExport }
    )
  }

  // Write to node_modules/@nuxthub/db/ for direct imports (workflow compatibility)
  const physicalDbDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'db')
  await mkdir(physicalDbDir, { recursive: true })

  // Write db.mjs to node_modules/@nuxthub/db/
  await writeFile(
    join(physicalDbDir, 'db.mjs'),
    drizzleOrmContent.replace(/from '\.\/db\/schema\.mjs'/g, 'from \'./schema.mjs\'').replace(/from '\.\/db\/relations\.mjs'/g, 'from \'./relations.mjs\'')
  )

  const relationsTypesImports = !useRelationsV2 ? '' : `import { relations } from './relations.mjs'`

  // Write db.d.ts for TypeScript support
  const physicalDbTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driverForTypes}'
import * as schema from './schema.mjs'
${relationsTypesImports}

/**
 * The database schema object
 * Defined in server/db/schema.ts and server/db/schema/*.ts
 */
export { schema${relationExport} }
/**
 * The ${driver} database client.
 */
export const db: ReturnType<typeof drizzleCore<${useRelationsV2 ? 'typeof schema, typeof relations' : 'typeof schema'}>>
`

  await writeFile(
    join(physicalDbDir, 'db.d.ts'),
    physicalDbTypes
  )

  // Create package.json and stub schema files for Node.js module resolution
  // These are needed during `nuxt prepare` so tsconfig paths resolve correctly
  const packageJson = {
    name: '@nuxthub/db',
    version: '0.0.0',
    type: 'module',
    exports: {
      '.': { types: './db.d.ts', default: './db.mjs' },
      './schema': { types: './schema.d.mts', default: './schema.mjs' },
      './relations': { types: './relations.d.mts', default: './relations.mjs' }
    }
  }
  try {
    await writeFile(join(physicalDbDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    // Stub schema files only if they don't exist (real types written by app:templatesGenerated hook)
    const schemaPath = join(physicalDbDir, 'schema.mjs')
    const schemaDtsPath = join(physicalDbDir, 'schema.d.mts')
    const schemaExists = await stat(schemaPath).then(s => s.size > 20).catch(() => false)
    const schemaDtsExists = await stat(schemaDtsPath).then(s => s.size > 20).catch(() => false)
    if (!schemaExists) await writeFile(schemaPath, 'export {}')
    if (!schemaDtsExists) await writeFile(schemaDtsPath, 'export {}')
  } catch (error) {
    throw new Error(`Failed to create @nuxthub/db package files: ${(error as Error).message}`)
  }

  // Create hub:db alias to @nuxthub/db for backwards compatibility
  nuxt.options.alias!['hub:db'] = '@nuxthub/db'

  // Add auto-imports for both @nuxthub/db and hub:db
  addServerImports({ name: 'db', from: '@nuxthub/db', meta: { description: `The ${driver} database client.` } })
  addServerImports({ name: 'schema', from: '@nuxthub/db', meta: { description: `The database schema object` } })
}

async function setupDatabaseConfig(nuxt: Nuxt, hub: ResolvedHubConfig) {
  // generate drizzle.config.ts in .nuxt/hub/db/drizzle.config.ts
  const { dialect, casing } = hub.db as ResolvedDatabaseConfig
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
