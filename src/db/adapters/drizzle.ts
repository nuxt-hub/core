import type { HubDbAdapter, HubDbAdapterContext, Driver } from './interface'

export const drizzleAdapter: HubDbAdapter = {
  name: 'drizzle',
  schemaPath: 'server/db/schema.ts',
  requiredDeps: ['drizzle-orm'],
  requiredDevDeps: ['drizzle-kit'],

  async validateSchema(_ctx: HubDbAdapterContext): Promise<void> {
    // Drizzle schema validation is handled by TypeScript compilation
    // No additional validation needed
  },

  checkMissingDeps(deps: Record<string, string>, driver: Driver): string[] {
    const missing: string[] = []

    if (!deps['drizzle-orm']) missing.push('drizzle-orm')
    if (!deps['drizzle-kit']) missing.push('drizzle-kit')

    // Driver-specific deps
    if (driver === 'postgres-js' && !deps['postgres']) missing.push('postgres')
    if (driver === 'neon-http' && !deps['@neondatabase/serverless']) missing.push('@neondatabase/serverless')
    if (driver === 'pglite' && !deps['@electric-sql/pglite']) missing.push('@electric-sql/pglite')
    if (driver === 'mysql2' && !deps.mysql2) missing.push('mysql2')
    if (driver === 'libsql' && !deps['@libsql/client']) missing.push('@libsql/client')

    return missing
  },

  createClientCode(ctx: HubDbAdapterContext): string {
    const { dbConfig, hub } = ctx
    const { dialect, driver, connection, mode, casing } = dbConfig

    const modeOption = dialect === 'mysql' ? `, mode: '${mode || 'default'}'` : ''
    const casingOption = casing ? `, casing: '${casing}'` : ''

    const executeMethod = dialect === 'sqlite' ? 'run' : 'execute'
    const getRowsCode = dialect === 'mysql'
      ? '(result) => result[0] || []'
      : '(result) => result.results || result.rows || result || []'

    // Default implementation
    let code = `import { drizzle } from 'drizzle-orm/${driver}'
import { sql } from 'drizzle-orm'
import * as schema from './db/schema.mjs'

const db = drizzle({ connection: ${JSON.stringify(connection)}, schema${modeOption}${casingOption} })

// Execute raw SQL for migrations (ORM-agnostic interface)
async function executeRaw(query) {
  return db.${executeMethod}(sql.raw(query))
}
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`

    if (driver === 'pglite' && ctx.nuxt.options.dev) {
      // PGlite instance exported for use in devtools Drizzle Studio
      code = `import { drizzle } from 'drizzle-orm/pglite'
import { sql } from 'drizzle-orm'
import { PGlite } from '@electric-sql/pglite'
import * as schema from './db/schema.mjs'

const client = new PGlite(${JSON.stringify(connection.dataDir)})
const db = drizzle({ client, schema${casingOption} })

async function executeRaw(query) { return db.${executeMethod}(sql.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, client, executeRaw, getRows }
`
    }

    if (driver === 'postgres-js' && ctx.nuxt.options.dev) {
      const replicaUrls = (dbConfig.replicas || []).filter(Boolean)
      const hasReplicas = replicaUrls.length > 0

      if (hasReplicas) {
        code = `import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { withReplicas } from 'drizzle-orm/pg-core'
import postgres from 'postgres'
import * as schema from './db/schema.mjs'

const primaryClient = postgres(${JSON.stringify(connection.url)}, { onnotice: () => {} })
const primary = drizzle({ client: primaryClient, schema${casingOption} })
const replicas = [${replicaUrls.map(url => `drizzle({ client: postgres(${JSON.stringify(url)}, { onnotice: () => {} }), schema${casingOption} })`).join(', ')}]
const db = withReplicas(primary, replicas)

async function executeRaw(query) { return primary.${executeMethod}(sql.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`
      }
      else {
        code = `import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from './db/schema.mjs'

const client = postgres(${JSON.stringify(connection.url)}, {
  onnotice: () => {}
})
const db = drizzle({ client, schema${casingOption} })

async function executeRaw(query) { return db.${executeMethod}(sql.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`
      }
    }

    if (driver === 'mysql2' && ctx.nuxt.options.dev) {
      const replicaUrls = (dbConfig.replicas || []).filter(Boolean)
      const hasReplicas = replicaUrls.length > 0

      if (hasReplicas) {
        code = `import { drizzle } from 'drizzle-orm/mysql2'
import { sql } from 'drizzle-orm'
import { withReplicas } from 'drizzle-orm/mysql-core'
import * as schema from './db/schema.mjs'

const primary = drizzle({ connection: ${JSON.stringify(connection)}, schema${modeOption}${casingOption} })
const replicas = [${replicaUrls.map(url => `drizzle({ connection: { uri: ${JSON.stringify(url)} }, schema${modeOption}${casingOption} })`).join(', ')}]
const db = withReplicas(primary, replicas)

async function executeRaw(query) { return primary.${executeMethod}(sql.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`
      }
    }

    if (driver === 'neon-http') {
      code = `import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql as sqlTag } from 'drizzle-orm'
import * as schema from './db/schema.mjs'

const neonSql = neon(${JSON.stringify(connection.url)})
const db = drizzle(neonSql, { schema${casingOption} })

async function executeRaw(query) { return db.${executeMethod}(sqlTag.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`
    }

    if (driver === 'd1') {
      // D1 requires lazy binding access - bindings only available in request context on CF Workers
      code = `import { drizzle } from 'drizzle-orm/d1'
import { sql } from 'drizzle-orm'
import * as schema from './db/schema.mjs'

let _db
function getDb() {
  if (!_db) {
    const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
    if (!binding) throw new Error('DB binding not found')
    _db = drizzle(binding, { schema${casingOption} })
  }
  return _db
}
const db = new Proxy({}, { get(_, prop) { return getDb()[prop] } })

async function executeRaw(query) { return getDb().${executeMethod}(sql.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`
    }

    if (driver === 'd1-http') {
      // D1 over HTTP using sqlite-proxy - use env vars at runtime to avoid token exposure in generated code
      code = `import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { sql as sqlTag } from 'drizzle-orm'
import * as schema from './db/schema.mjs'

const accountId = process.env.NUXT_HUB_CLOUDFLARE_ACCOUNT_ID
const databaseId = process.env.NUXT_HUB_CLOUDFLARE_DATABASE_ID
const apiToken = process.env.NUXT_HUB_CLOUDFLARE_API_TOKEN

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

const db = drizzle(d1HttpDriver, { schema${casingOption} })

async function executeRaw(query) { return db.${executeMethod}(sqlTag.raw(query)) }
const getRowsFn = ${getRowsCode}

export { db, schema, executeRaw, getRows: getRowsFn }
`
    }

    if (['postgres-js', 'mysql2'].includes(driver) && hub.hosting.includes('cloudflare')) {
      // Hyperdrive requires lazy binding access - bindings only available in request context on CF Workers
      const bindingName = driver === 'postgres-js' ? 'POSTGRES' : 'MYSQL'
      code = `import { drizzle } from 'drizzle-orm/${driver}'
import { sql } from 'drizzle-orm'
import * as schema from './db/schema.mjs'

let _db
function getDb() {
  if (!_db) {
    const hyperdrive = process.env.${bindingName} || globalThis.__env__?.${bindingName} || globalThis.${bindingName}
    if (!hyperdrive) throw new Error('${bindingName} binding not found')
    _db = drizzle({ connection: hyperdrive.connectionString, schema${modeOption}${casingOption} })
  }
  return _db
}
const db = new Proxy({}, { get(_, prop) { return getDb()[prop] } })

async function executeRaw(query) { return getDb().${executeMethod}(sql.raw(query)) }
const getRows = ${getRowsCode}

export { db, schema, executeRaw, getRows }
`
    }

    return code
  },

  getClientTypes(ctx: HubDbAdapterContext): string {
    const { driver } = ctx.dbConfig
    // For types, d1-http uses sqlite-proxy
    const driverForTypes = driver === 'd1-http' ? 'sqlite-proxy' : driver

    return `import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle as drizzleCore } from 'drizzle-orm/${driverForTypes}'
import * as schema from './db/schema.mjs'

declare module 'hub:db' {
  /**
   * The database schema object
   * Defined in server/db/schema.ts and server/db/schema/*.ts
   */
  export { schema }
  /**
   * The ${driver} database client.
   */
  export const db: ReturnType<typeof drizzleCore<typeof schema>>
  /** Execute raw SQL for migrations */
  export function executeRaw(query: string): Promise<unknown>
  /** Extract rows from query result */
  export function getRows(result: unknown): unknown[]
}`
  }
}
