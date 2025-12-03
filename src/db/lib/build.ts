import { cp } from 'node:fs/promises'
import { join, relative, resolve } from 'pathe'
import type { Nitro } from 'nitropack'
import type { ResolvedHubConfig } from '../../types'
import { consola } from 'consola'
import { createDrizzleClient } from './client'
import { applyDatabaseMigrations, applyDatabaseQueries } from './migrations'
import { build } from 'tsdown'

const log = consola.withTag('nuxt:hub')

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

export async function buildDatabaseSchema(buildDir: string, { relativeDir }: { relativeDir?: string } = {}) {
  relativeDir = relativeDir || buildDir
  const entry = join(buildDir, 'hub/db/schema.entry.ts')
  await build({
    entry: {
      schema: entry
    },
    outDir: join(buildDir, 'hub/db'),
    outExtensions: () => ({
      js: '.mjs',
      dts: '.d.ts'
    }),
    alias: {
      'hub:db:schema': entry
    },
    platform: 'neutral',
    format: 'esm',
    skipNodeModulesBundle: true,
    dts: {
      build: false,
      tsconfig: join(buildDir, 'tsconfig.shared.json'),
      newContext: true
    },
    clean: false,
    logLevel: 'warn'
  })
  consola.debug(`Database schema built successfully at \`${relative(relativeDir, join(buildDir, 'hub/db/schema.mjs'))}\``)
}
