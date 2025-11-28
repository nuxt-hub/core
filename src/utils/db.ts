import { cp } from 'node:fs/promises'
import { logger } from '@nuxt/kit'
import { resolve } from 'pathe'
import type { Nitro } from 'nitropack'
import type { ResolvedDatabaseConfig, ResolvedHubConfig } from '../types'

import { applyDatabaseMigrations, applyDatabaseQueries } from '../runtime/db/server/utils/migrations/migrations'

const log = logger.withTag('nuxt:hub')

export function getDatabasePathMetadata(path: string): { name: string, dialect: string | undefined, path: string } {
  // remove .ts, .js, .mjs and .sql extensions
  let name = path.replace(/\.(ts|js|mjs|sql)$/, '')
  // Remove dialect suffix if present (e.g., .postgresql, .sqlite, .mysql)
  const dialect = name.match(/\.(postgresql|sqlite|mysql)$/)?.[1]
  if (dialect) {
    name = name.replace(`.${dialect}`, '')
  }

  return { name, dialect, path }
}

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

/**
 * Copies database migrations and queries to the build output directory
 */
export async function copyDatabaseAssets(nitro: Nitro, hub: ResolvedHubConfig) {
  if (!hub.db) return

  const migrationsPath = resolve(nitro.options.rootDir, hub.dir!, 'db/migrations')
  const queriesPath = resolve(nitro.options.rootDir, hub.dir!, 'db/queries')
  const outputDir = nitro.options.output.serverDir

  const bundledItems = []

  // Copy migrations if they exist
  try {
    await cp(migrationsPath, resolve(outputDir, 'db/migrations'), { recursive: true })
    bundledItems.push('migrations')
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      log.info('No local database migrations found')
    } else {
      console.error('Error copying migrations:', error)
    }
  }

  // Copy queries if they exist
  try {
    await cp(queriesPath, resolve(outputDir, 'db/queries'), { recursive: true })
    bundledItems.push('queries')
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      log.info('No local database queries found')
    } else {
      console.error('Error copying queries:', error)
    }
  }

  if (bundledItems.length > 0) {
    log.info(`Database ${bundledItems.join(' and ')} included in build`)
  }
}

/**
 * Applies database migrations during build time
 */
export async function applyBuildTimeMigrations(nitro: Nitro, hub: ResolvedHubConfig) {
  if (!hub.db || !hub.db.applyMigrationsDuringBuild) return

  try {
    const db = await createDrizzleClient(hub.db)

    const buildHubConfig = {
      ...hub,
      dir: nitro.options.output.serverDir
    } as ResolvedHubConfig

    log.info('Applying database migrations...')

    const migrationsApplied = await applyDatabaseMigrations(buildHubConfig, db)
    if (migrationsApplied === false) {
      process.exit(1)
    }
    const queriesApplied = await applyDatabaseQueries(buildHubConfig, db)
    if (queriesApplied === false) {
      process.exit(1)
    }
    await db.$client?.end?.()
  } catch (error: unknown) {
    log.error('Failed to apply database migrations during build:', error)
    throw error
  }
}
