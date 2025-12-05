import { mkdir } from 'node:fs/promises'
import { join } from 'pathe'
import type { ResolvedDatabaseConfig } from '@nuxthub/core'

/**
 * Creates a Drizzle client for the given configuration
 */
export async function createDrizzleClient(config: ResolvedDatabaseConfig, hubDir: string) {
  const { driver, connection } = config
  let client

  let pkg = ''
  if (driver === 'postgres-js') {
    const clientPkg = 'postgres'
    const { default: postgres } = await import(clientPkg)
    client = postgres(connection.url, {
      onnotice: () => {}
    })
    pkg = 'drizzle-orm/postgres-js'
    const { drizzle } = await import(pkg)
    return drizzle({ client })
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
  return drizzle({ connection })
}
