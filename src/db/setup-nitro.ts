import { existsSync } from 'node:fs'
import { mkdir, copyFile, writeFile, stat } from 'node:fs/promises'
import { glob } from 'tinyglobby'
import { join, resolve as resolveFs, relative } from 'pathe'
import { defu } from 'defu'
import type { Nitro } from 'nitropack/types'
import type { HubConfig, ResolvedHubConfig, ResolvedDatabaseConfig } from '@nuxthub/core'
import { resolve, addWranglerBindingNitro } from '../utils-nitro'
import { cloudflareHooks } from '../hosting/cloudflare'

const logTag = 'nitro:hub'

type DatabaseLib = typeof import('./lib')

let databaseLibPromise: Promise<DatabaseLib> | undefined

async function loadDatabaseLib() {
  // ESM does not support directory imports (e.g. `./db/lib`), so always import the entry file.
  databaseLibPromise ||= import('./lib/index')
  return databaseLibPromise
}

function resolveRuntimePath(path: string) {
  const candidates = [
    resolve(`${path}.mjs`),
    resolve(`${path}.js`),
    resolve(`${path}.ts`),
    resolve(path)
  ]
  return candidates.find(candidate => existsSync(candidate)) || resolve(path)
}

function generateLazyDbTemplate(imports: string, getDbBody: string): string {
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
export { db, schema }
`
}

export async function resolveDatabaseConfigNitro(nitro: Nitro, hub: HubConfig): Promise<ResolvedDatabaseConfig | false> {
  if (!hub.db) return false

  let config = typeof hub.db === 'string' ? { dialect: hub.db } : hub.db
  config = defu(config, {
    migrationsDirs: [resolveFs(nitro.options.rootDir, 'server/db/migrations')],
    queriesPaths: [],
    applyMigrationsDuringBuild: true
  })

  switch (config.dialect) {
    case 'sqlite': {
      const userExplicitLibsql = config.driver === 'libsql'

      if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        config.driver = 'libsql'
        config.connection = defu(config.connection, {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN
        })
        break
      }
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
      if (hub.hosting.includes('cloudflare') && !nitro.options.dev) {
        config.driver = 'd1'
        break
      }
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
      if (hub.hosting.includes('cloudflare') && config.connection?.hyperdriveId && !config.driver) {
        config.driver = 'postgres-js'
        break
      }
      config.connection = defu(config.connection, { url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL || '' })
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
      if (hub.hosting.includes('cloudflare') && config.connection?.hyperdriveId && !config.driver) {
        config.driver = 'mysql2'
        break
      }
      config.driver ||= 'mysql2'
      config.connection = defu(config.connection, { uri: process.env.MYSQL_URL || process.env.DATABASE_URL || '' })
      if (config.applyMigrationsDuringBuild && !config.connection.uri) {
        throw new Error('MySQL requires DATABASE_URL or MYSQL_URL environment variable when `applyMigrationsDuringBuild` is enabled')
      }
      break
    }
  }

  if (config.driver === 'd1') {
    config.applyMigrationsDuringBuild = false
  }

  return config as ResolvedDatabaseConfig
}

export async function setupDatabaseNitro(nitro: Nitro, hub: HubConfig, deps: Record<string, string>) {
  hub.db = await resolveDatabaseConfigNitro(nitro, hub)
  if (!hub.db) return

  const { dialect, driver, connection, migrationsDirs, queriesPaths } = hub.db as ResolvedDatabaseConfig
  const log = nitro.logger.withTag(logTag)

  log.info(`\`hub:db\` using \`${dialect}\` database with \`${driver}\` driver`)

  nitro.options.alias ||= {}

  if (driver === 'd1' && connection?.databaseId) {
    addWranglerBindingNitro(nitro, 'd1_databases', { binding: 'DB', database_id: connection.databaseId })
  }
  if (['postgres-js', 'mysql2'].includes(driver) && connection?.hyperdriveId) {
    const binding = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    addWranglerBindingNitro(nitro, 'hyperdrive', { binding, id: connection.hyperdriveId })
  }

  if (!deps['drizzle-orm'] || !deps['drizzle-kit']) {
    log.error('Please run `npx nypm i drizzle-orm drizzle-kit` to properly setup Drizzle ORM with NuxtHub.')
  }
  if (driver === 'postgres-js' && !deps['postgres']) {
    log.error('Please run `npx nypm i postgres` to use PostgreSQL as database.')
  } else if (driver === 'neon-http' && !deps['@neondatabase/serverless']) {
    log.error('Please run `npx nypm i @neondatabase/serverless` to use Neon serverless database.')
  } else if (driver === 'pglite' && !deps['@electric-sql/pglite']) {
    log.error('Please run `npx nypm i @electric-sql/pglite` to use PGlite as database.')
  } else if (driver === 'mysql2' && !deps.mysql2) {
    log.error('Please run `npx nypm i mysql2` to use MySQL as database.')
  } else if (driver === 'libsql' && !deps['@libsql/client']) {
    log.error('Please run `npx nypm i @libsql/client` to use SQLite as database.')
  }

  nitro.options.plugins ||= []
  const migrationsPlugin = resolveRuntimePath('db/runtime/plugins/migrations.dev')
  if (!nitro.options.plugins.includes(migrationsPlugin)) {
    nitro.options.plugins.push(migrationsPlugin)
  }

  const dbLib = await loadDatabaseLib()

  await generateDatabaseSchemaEntry(nitro, hub as ResolvedHubConfig, dbLib)
  await nitro.hooks.callHook('hub:db:migrations:dirs', migrationsDirs)
  await dbLib.copyDatabaseMigrationsToHubDir(hub as ResolvedHubConfig)
  await nitro.hooks.callHook('hub:db:queries:paths', queriesPaths, dialect)
  await dbLib.copyDatabaseQueriesToHubDir(hub as ResolvedHubConfig)

  nitro.hooks.hook('build:before', async () => {
    await generateDatabaseSchemaEntry(nitro, hub as ResolvedHubConfig, dbLib)
    await dbLib.buildDatabaseSchema(nitro.options.buildDir, { relativeDir: nitro.options.rootDir, alias: nitro.options.alias })
    await copyDatabaseSchemaToNodeModules(nitro)
    await dbLib.copyDatabaseAssets(nitro, hub as ResolvedHubConfig)
    await dbLib.applyBuildTimeMigrations(nitro, hub as ResolvedHubConfig)
  })

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

  await setupDatabaseClientNitro(nitro, hub as ResolvedHubConfig)
  await setupDatabaseConfigNitro(nitro, hub as ResolvedHubConfig)
}

async function generateDatabaseSchemaEntry(nitro: Nitro, hub: ResolvedHubConfig, dbLib: DatabaseLib) {
  if (!hub.db) return
  const dialect = hub.db.dialect

  const schemaPatterns = [
    resolveFs(nitro.options.rootDir, 'server/db/schema.ts'),
    resolveFs(nitro.options.rootDir, `server/db/schema.${dialect}.ts`),
    resolveFs(nitro.options.rootDir, 'server/db/schema/*.ts')
  ]

  let schemaPaths = await glob(schemaPatterns, { absolute: true, onlyFiles: true })
  await nitro.hooks.callHook('hub:db:schema:extend', { dialect, paths: schemaPaths })

  schemaPaths = schemaPaths.filter((path) => {
    const meta = dbLib.getDatabaseSchemaPathMetadata(path)
    return !meta.dialect || meta.dialect === dialect
  })

  const entryPath = join(nitro.options.buildDir, 'hub/db/schema.entry.ts')
  await mkdir(join(nitro.options.buildDir, 'hub/db'), { recursive: true })
  const contents = schemaPaths.map(path => `export * from '${path}'`).join('\n')
  await writeFile(entryPath, contents)
}

async function setupDatabaseClientNitro(nitro: Nitro, hub: ResolvedHubConfig) {
  const { dialect, driver, connection, mode, casing, replicas } = hub.db as ResolvedDatabaseConfig
  const driverForTypes = driver === 'd1-http' ? 'sqlite-proxy' : driver

  const databaseTypes = `declare module 'hub:db' {
  export * from '@nuxthub/db'
}`
  const databaseSchemaTypes = `declare module 'hub:db:schema' {
  export * from '@nuxthub/db/schema'
}`

  nitro.hooks.hook('types:extend', async (types) => {
    const typesDir = join(nitro.options.buildDir, 'types')
    await mkdir(typesDir, { recursive: true })
    const dtsPath = join(typesDir, 'hub-db.d.ts')
    const schemaDtsPath = join(typesDir, 'hub-db-schema.d.ts')
    await writeFile(dtsPath, databaseTypes)
    await writeFile(schemaDtsPath, databaseSchemaTypes)
    if (types.tsConfig) {
      types.tsConfig.include = types.tsConfig.include || []
      types.tsConfig.include.push(dtsPath)
      types.tsConfig.include.push(schemaDtsPath)
    }
  })

  const modeOption = dialect === 'mysql' ? `, mode: '${mode || 'default'}'` : ''
  const casingOption = casing ? `, casing: '${casing}'` : ''
  let drizzleOrmContent = `import { drizzle } from 'drizzle-orm/${driver}'
import * as schema from './db/schema.mjs'

const db = drizzle({ connection: ${JSON.stringify(connection)}, schema${modeOption}${casingOption} })
export { db, schema }
`

  if (driver === 'pglite' && nitro.options.dev) {
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import * as schema from './db/schema.mjs'

const client = new PGlite(${JSON.stringify(connection.dataDir)})
const db = drizzle({ client, schema${casingOption} })
export { db, schema, client }
`

    nitro.options.handlers ||= []
    nitro.options.handlers.push({
      handler: resolveRuntimePath('db/runtime/api/launch-studio.post.dev'),
      method: 'post',
      route: '/api/_hub/db/launch-studio'
    })
  }
  if (driver === 'postgres-js' && nitro.options.dev) {
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/postgres-js'
${hasReplicas ? `import { withReplicas } from 'drizzle-orm/pg-core'\n` : ''}import postgres from 'postgres'
import * as schema from './db/schema.mjs'

const client = postgres('${connection.url}', { onnotice: () => {} })
${hasReplicas
  ? `const primary = drizzle({ client, schema${casingOption} })

const replicaUrls = ${JSON.stringify(replicaUrls)}
const replicaConnections = replicaUrls.map(replicaUrl => {
  const replicaClient = postgres(replicaUrl, { onnotice: () => {} })
  return drizzle({ client: replicaClient, schema${casingOption} })
})
const db = withReplicas(primary, replicaConnections)`
  : `const db = drizzle({ client, schema${casingOption} })`}
export { db, schema }
`
  }
  if (driver === 'mysql2' && nitro.options.dev) {
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    if (hasReplicas) {
      drizzleOrmContent = `import { drizzle } from 'drizzle-orm/mysql2'
import { withReplicas } from 'drizzle-orm/mysql-core'
import * as schema from './db/schema.mjs'

const primary = drizzle({ connection: ${JSON.stringify(connection)}, schema${modeOption}${casingOption} })

const replicaUrls = ${JSON.stringify(replicaUrls)}
const replicaConnections = replicaUrls.map(replicaUrl => {
  return drizzle({ connection: { uri: replicaUrl }, schema${modeOption}${casingOption} })
})
const db = withReplicas(primary, replicaConnections)
export { db, schema }
`
    }
  }
  if (driver === 'neon-http') {
    const urlExpr = connection.url ? `'${connection.url}'` : `process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL`
    drizzleOrmContent = generateLazyDbTemplate(
      `import { neon } from '@neondatabase/serverless'\nimport { drizzle } from 'drizzle-orm/neon-http'`,
      `    const url = ${urlExpr}
    if (!url) throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRESQL_URL required')
    const sql = neon(url)
    _db = drizzle(sql, { schema${casingOption} })`
    )
  }
  if (driver === 'd1') {
    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/d1'`,
      `    const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
    if (!binding) throw new Error('DB binding not found')
    _db = drizzle(binding, { schema${casingOption} })`
    )
  }
  if (driver === 'd1-http') {
    drizzleOrmContent = `import { drizzle } from 'drizzle-orm/sqlite-proxy'
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

const db = drizzle(d1HttpDriver, { schema${casingOption} })

export { db, schema }
`
  }
  if (['postgres-js', 'mysql2'].includes(driver) && hub.hosting.includes('cloudflare') && connection?.hyperdriveId) {
    const bindingName = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/${driver}'`,
      `    const hyperdrive = process.env.${bindingName} || globalThis.__env__?.${bindingName} || globalThis.${bindingName}
    if (!hyperdrive) throw new Error('${bindingName} binding not found')
    _db = drizzle({ connection: hyperdrive.connectionString, schema${modeOption}${casingOption} })`
    )
  }
  if (driver === 'postgres-js' && !nitro.options.dev && !hub.hosting.includes('cloudflare')) {
    const urlExpr = connection.url ? `'${connection.url}'` : `process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL`
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/postgres-js'
${hasReplicas ? `import { withReplicas } from 'drizzle-orm/pg-core'\n` : ''}import postgres from 'postgres'`,
      `    const url = ${urlExpr}
    if (!url) throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRESQL_URL required')
    const client = postgres(url, { onnotice: () => {} })
${hasReplicas
  ? `    const primary = drizzle({ client, schema${casingOption} })

    const replicaUrls = ${JSON.stringify(replicaUrls)}
    const replicaConnections = replicaUrls.map(replicaUrl => {
      const replicaClient = postgres(replicaUrl, { onnotice: () => {} })
      return drizzle({ client: replicaClient, schema${casingOption} })
    })
    _db = withReplicas(primary, replicaConnections)`
  : `    _db = drizzle({ client, schema${casingOption} })`}`
    )
  }
  if (driver === 'mysql2' && !nitro.options.dev && !hub.hosting.includes('cloudflare')) {
    const uriExpr = connection.uri ? `'${connection.uri}'` : `process.env.MYSQL_URL || process.env.DATABASE_URL`
    const replicaUrls = (replicas || []).filter(Boolean)
    const hasReplicas = replicaUrls.length > 0

    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/mysql2'${hasReplicas ? `\nimport { withReplicas } from 'drizzle-orm/mysql-core'` : ''}`,
      `    const uri = ${uriExpr}
    if (!uri) throw new Error('DATABASE_URL or MYSQL_URL required')
${hasReplicas
  ? `    const primary = drizzle({ connection: { uri }, schema${modeOption}${casingOption} })

    const replicaUrls = ${JSON.stringify(replicaUrls)}
    const replicaConnections = replicaUrls.map(replicaUrl => {
      return drizzle({ connection: { uri: replicaUrl }, schema${modeOption}${casingOption} })
    })
    _db = withReplicas(primary, replicaConnections)`
  : `    _db = drizzle({ connection: { uri }, schema${modeOption}${casingOption} })`}`
    )
  }
  if (driver === 'libsql' && !connection.url) {
    drizzleOrmContent = generateLazyDbTemplate(
      `import { drizzle } from 'drizzle-orm/libsql'`,
      `    const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN
    if (!url) throw new Error('Database URL not found. Set TURSO_DATABASE_URL, LIBSQL_URL, or DATABASE_URL')
    _db = drizzle({ connection: { url, authToken }, schema${casingOption} })`
    )
  }

  const physicalDbDir = join(nitro.options.rootDir, 'node_modules', '@nuxthub', 'db')
  await mkdir(physicalDbDir, { recursive: true })

  await writeFile(
    join(physicalDbDir, 'db.mjs'),
    drizzleOrmContent.replace(/from '\.\/db\/schema\.mjs'/g, 'from \'./schema.mjs\'')
  )

  const physicalDbTypes = `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driverForTypes}'
import * as schema from './schema.mjs'

/**
 * The database schema object
 * Defined in server/db/schema.ts and server/db/schema/*.ts
 */
export { schema }
/**
 * The ${driver} database client.
 */
export const db: ReturnType<typeof drizzleCore<typeof schema>>
`

  await writeFile(join(physicalDbDir, 'db.d.ts'), physicalDbTypes)

  const packageJson = {
    name: '@nuxthub/db',
    version: '0.0.0',
    type: 'module',
    exports: {
      '.': { types: './db.d.ts', default: './db.mjs' },
      './schema': { types: './schema.d.mts', default: './schema.mjs' }
    }
  }
  try {
    await writeFile(join(physicalDbDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    const schemaPath = join(physicalDbDir, 'schema.mjs')
    const schemaDtsPath = join(physicalDbDir, 'schema.d.mts')
    const schemaExists = await stat(schemaPath).then(s => s.size > 20).catch(() => false)
    const schemaDtsExists = await stat(schemaDtsPath).then(s => s.size > 20).catch(() => false)
    if (!schemaExists) await writeFile(schemaPath, 'export {}')
    if (!schemaDtsExists) await writeFile(schemaDtsPath, 'export {}')
  } catch (error) {
    throw new Error(`Failed to create @nuxthub/db package files: ${(error as Error).message}`)
  }

  nitro.options.alias ||= {}
  nitro.options.alias['hub:db'] = '@nuxthub/db'
  nitro.options.alias['hub:db:schema'] = '@nuxthub/db/schema'

  if (nitro.options.imports !== false) {
    nitro.options.imports = nitro.options.imports || {}
    nitro.options.imports.presets ??= []
    nitro.options.imports.presets.push({
      from: '@nuxthub/db',
      imports: ['db', 'schema']
    })
  }
}

async function copyDatabaseSchemaToNodeModules(nitro: Nitro) {
  const physicalDbDir = join(nitro.options.rootDir, 'node_modules', '@nuxthub', 'db')
  await mkdir(physicalDbDir, { recursive: true })
  try {
    await copyFile(join(nitro.options.buildDir, 'hub/db/schema.mjs'), join(physicalDbDir, 'schema.mjs'))
  } catch {
    // Ignore if schema does not exist yet
  }
  try {
    await copyFile(join(nitro.options.buildDir, 'hub/db/schema.d.mts'), join(physicalDbDir, 'schema.d.mts'))
  } catch {
    // Ignore if types do not exist yet
  }
}

async function setupDatabaseConfigNitro(nitro: Nitro, hub: ResolvedHubConfig) {
  const { dialect, casing } = hub.db as ResolvedDatabaseConfig
  const casingConfig = casing ? `\n  casing: '${casing}',` : ''
  const migrationsDir = relative(
    nitro.options.rootDir,
    resolveFs(nitro.options.rootDir, `server/db/migrations/${dialect}`)
  )
  const configPath = join(nitro.options.buildDir, 'hub/db/drizzle.config.ts')
  await mkdir(join(nitro.options.buildDir, 'hub/db'), { recursive: true })
  await writeFile(configPath, `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: '${dialect}',${casingConfig}
  schema: '${relative(nitro.options.rootDir, resolveFs(nitro.options.buildDir, 'hub/db/schema.mjs'))}',
  out: '${migrationsDir}'
});`)
}
