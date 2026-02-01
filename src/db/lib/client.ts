import { mkdir } from 'node:fs/promises'
import { join } from 'pathe'
import type { ResolvedDatabaseConfig } from '@nuxthub/core'
import type { Casing } from 'drizzle-orm'

async function createD1HttpClient(accountId: string, databaseId: string, apiToken: string, casing?: string) {
  const d1HttpDriver = async (sql: string, params: unknown[], method: string) => {
    if (method === 'values') method = 'all'
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params })
    })
    const data = await response.json() as { errors?: unknown[], success?: boolean, result?: { success?: boolean, results?: { rows?: unknown[] } }[] }
    if (data.errors?.length || !data.success) {
      throw new Error(`D1 HTTP error: ${JSON.stringify(data)}`)
    }
    const queryResult = data.result?.[0]
    if (!queryResult?.success) {
      throw new Error(`D1 HTTP error: ${JSON.stringify(data)}`)
    }
    const rows = queryResult.results?.rows || []
    if (method === 'get') return { rows: rows.length ? rows[0] : [] }
    return { rows }
  }
  const { drizzle } = await import('drizzle-orm/sqlite-proxy')
  return drizzle(d1HttpDriver as any, { casing: casing as Casing })
}

/**
 * Creates a Drizzle client for the given configuration
 */
export async function createDrizzleClient(config: ResolvedDatabaseConfig, hubDir: string) {
  const { driver, connection, casing } = config
  let client

  let pkg = ''
  if (driver === 'd1' || driver === 'd1-http') {
    // Get credentials from config or env vars
    const accountId = connection?.accountId || process.env.NUXT_HUB_CLOUDFLARE_ACCOUNT_ID
    const databaseId = connection?.databaseId || process.env.NUXT_HUB_CLOUDFLARE_DATABASE_ID
    const apiToken = connection?.apiToken || process.env.NUXT_HUB_CLOUDFLARE_API_TOKEN
    if (!accountId || !databaseId || !apiToken) {
      throw new Error('D1 CLI commands require Cloudflare API credentials. Set NUXT_HUB_CLOUDFLARE_ACCOUNT_ID, NUXT_HUB_CLOUDFLARE_DATABASE_ID, and NUXT_HUB_CLOUDFLARE_API_TOKEN, or use `npx wrangler d1 migrations apply <DATABASE_NAME>` instead.')
    }
    return createD1HttpClient(accountId, databaseId, apiToken, casing)
  } else if (driver === 'postgres-js') {
    const clientPkg = 'postgres'
    const { default: postgres } = await import(clientPkg)
    client = postgres(connection.url, {
      onnotice: () => {}
    })
    pkg = 'drizzle-orm/postgres-js'
    const { drizzle } = await import(pkg)
    return drizzle({ client, casing })
  } else if (driver === 'neon-http') {
    const clientPkg = '@neondatabase/serverless'
    const { neon } = await import(clientPkg)
    const sql = neon(connection.url)
    pkg = 'drizzle-orm/neon-http'
    const { drizzle } = await import(pkg)
    return drizzle(sql, { casing })
  } else if (driver === 'libsql') {
    pkg = 'drizzle-orm/libsql'
  } else if (driver === 'mysql2') {
    pkg = 'drizzle-orm/mysql2'
  } else if (driver === 'pglite') {
    pkg = 'drizzle-orm/pglite'
    await mkdir(join(hubDir, 'db/pglite'), { recursive: true })
  } else {
    throw new Error(`Unsupported driver: ${driver}`)
  }

  const { drizzle } = await import(pkg)
  return drizzle({ connection, casing })
}
