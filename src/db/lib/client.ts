import type { ResolvedDatabaseConfig } from '../types'

/**
 * Creates a Drizzle client for the given configuration
 */
export async function createDrizzleClient(config: ResolvedDatabaseConfig) {
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
  } else {
    throw new Error(`Unsupported driver: ${driver}`)
  }

  const { drizzle } = await import(pkg)
  return drizzle({ connection })
}
