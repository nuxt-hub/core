import { cp } from 'node:fs/promises'
import { logger } from '@nuxt/kit'
import { resolve } from 'pathe'
import type { Nitro } from 'nitropack'
import type { ResolvedDatabaseConfig, ResolvedHubConfig } from '../types'

import { applyDatabaseMigrations, applyDatabaseQueries } from '../runtime/database/server/utils/migrations/migrations'

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

  let pkg = ''
  if (driver === 'libsql') {
    pkg = 'drizzle-orm/libsql'
  } else if (driver === 'postgres-js') {
    pkg = 'drizzle-orm/postgres-js'
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
  if (!hub.database) return

  const migrationsPath = resolve(nitro.options.rootDir, hub.dir!, 'database/migrations')
  const queriesPath = resolve(nitro.options.rootDir, hub.dir!, 'database/queries')
  const outputDir = nitro.options.output.dir

  const bundledItems = []

  // Copy migrations if they exist
  try {
    await cp(migrationsPath, resolve(outputDir, 'database/migrations'), { recursive: true })
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
    await cp(queriesPath, resolve(outputDir, 'database/queries'), { recursive: true })
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
  if (!hub.database || !hub.database.applyMigrationsDuringBuild) return

  try {
    const db = await createDrizzleClient(hub.database)

    const buildHubConfig = {
      ...hub,
      dir: nitro.options.output.dir
    } as ResolvedHubConfig

    log.info('Applying database migrations...')

    await applyDatabaseMigrations(buildHubConfig, db)
    await applyDatabaseQueries(buildHubConfig, db)

    log.info('Database migrations applied successfully')
  } catch (error: unknown) {
    log.error('Failed to apply database migrations during build:', error)
    throw error
  }
}
