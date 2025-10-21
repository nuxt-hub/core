import { cp } from 'node:fs/promises'
import { logger } from '@nuxt/kit'
import { resolve } from 'pathe'
import type { Nitro } from 'nitropack'
import type { HubConfig } from '../features'

import { applyDatabaseMigrations, applyDatabaseQueries } from '../runtime/database/server/utils/migrations/migrations'

const log = logger.withTag('nuxt:hub')

/**
 * Creates a Drizzle client for the given configuration
 */
async function createDrizzleClient(config: any) {
  const { driver, connection } = config

  if (driver === 'libsql') {
    const { drizzle } = await import('drizzle-orm/libsql')
    const { createClient } = await import('@libsql/client')
    const client = createClient(connection)
    return drizzle(client)
  } else if (driver === 'node-postgres') {
    const { drizzle } = await import('drizzle-orm/node-postgres')
    // @ts-expect-error - pg is an optional dependency
    const pg = await import('pg')
    const pool = new pg.Pool(connection)
    return drizzle(pool)
  } else if (driver === 'mysql2') {
    const { drizzle } = await import('drizzle-orm/mysql2')
    // @ts-expect-error - mysql2 is an optional dependency
    const mysql = await import('mysql2/promise')
    const pool = mysql.createPool(connection)
    return drizzle(pool)
  } else if (driver === 'pglite') {
    const { drizzle } = await import('drizzle-orm/pglite')
    const { PGlite } = await import('@electric-sql/pglite')
    const client = new PGlite(connection.dataDir)
    return drizzle(client)
  }

  throw new Error(`Unsupported driver: ${driver}`)
}

/**
 * Copies database migrations and queries to the build output directory
 */
export async function copyDatabaseAssets(nitro: Nitro, hub: HubConfig) {
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
export async function applyBuildTimeMigrations(nitro: Nitro, hub: HubConfig) {
  if (!hub.database || !hub.applyDatabaseMigrationsDuringBuild) return

  try {
    const dbConfig = nitro.options.runtimeConfig?.hub?.database
    if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string') {
      throw new Error('Database configuration not resolved properly')
    }

    const db = await createDrizzleClient(dbConfig)

    const buildHubConfig = {
      ...hub,
      dir: nitro.options.output.dir
    }

    log.info('Applying database migrations...')

    await applyDatabaseMigrations(buildHubConfig, db, dbConfig.dialect)
    await applyDatabaseQueries(buildHubConfig, db, dbConfig.dialect)

    log.info('Database migrations applied successfully')
  } catch (error: unknown) {
    log.error('Failed to apply database migrations during build:', error)
    throw error
  }
}
