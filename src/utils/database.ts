import { cp } from 'node:fs/promises'
import { logger } from '@nuxt/kit'
import { resolve } from 'pathe'
import { createDatabase } from 'db0'
import type { Nitro } from 'nitropack'
import type { HubConfig } from '../features'

import { applyDatabaseMigrations, applyDatabaseQueries } from '../runtime/database/server/utils/migrations/migrations'

const log = logger.withTag('nuxt:hub')

/**
 * Dynamically imports the correct db0 connector based on the Nitro database configuration
 */
export async function getDb0Connector(nitro: Nitro) {
  const dbConfig = nitro.options.database?.db
  if (!dbConfig?.connector) {
    throw new Error('No database connector configured in nitro.options.database.db')
  }

  const connector = dbConfig.connector === 'sqlite' ? 'better-sqlite3' : dbConfig.connector
  const connectorPath = `db0/connectors/${connector}`

  try {
    // Use createRequire to resolve from the consumer's context
    // This ensures that dependencies like 'pg' are found in the consumer's node_modules
    const { createRequire } = await import('node:module')
    const require = createRequire(process.cwd() + '/package.json')
    const resolvedPath = require.resolve(connectorPath)
    const connectorModule = await import(resolvedPath)
    return connectorModule.default || connectorModule
  } catch (error) {
    // Fallback: try direct import (original behavior)
    try {
      console.debug('Fallback to direct import of db0 connector', connectorPath)
      const connectorModule = await import(connectorPath)
      return connectorModule.default || connectorModule
    } catch (fallbackError) {
      throw new Error(`Failed to import db0 connector "${connector}" from "${connectorPath}": ${error}. Fallback also failed: ${fallbackError}`)
    }
  }
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
    const driver = await getDb0Connector(nitro)
    const db = createDatabase(driver(nitro.options.database.db?.options))

    const buildHubConfig = {
      ...hub,
      dir: nitro.options.output.dir
    }

    log.info('Applying database migrations...')

    await applyDatabaseMigrations(buildHubConfig, db)
    await applyDatabaseQueries(buildHubConfig, db)

    log.info('Database migrations applied successfully')
  } catch (error: unknown) {
    log.error('Failed to apply database migrations during build:', error)
    throw error
  }
}
