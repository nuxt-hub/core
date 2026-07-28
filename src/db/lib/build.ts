import { cp } from 'node:fs/promises'
import { join, relative, resolve } from 'pathe'
import type { Nitro } from 'nitropack'
import type { ResolvedHubConfig } from '@nuxthub/core'
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

  const migrationsPath = join(hub.dir, 'db/migrations')
  const queriesPath = join(hub.dir, 'db/queries')
  const outputDir = nitro.options.output.serverDir

  const bundledItems = []

  try {
    // copy migrations if they exist
    await cp(migrationsPath, resolve(outputDir, 'db/migrations'), { recursive: true })
    bundledItems.push('migrations')
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      log.info('No local database migrations found')
    } else {
      console.error('Error copying migrations:', error)
    }
  }

  try {
    // copy queries if they exist
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
    const db = await createDrizzleClient(hub.db, hub.dir)

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

export async function buildDatabaseSchema(buildDir: string, { relativeDir, alias }: { relativeDir?: string, alias?: Record<string, string> } = {}) {
  const startTime = Date.now()
  relativeDir = relativeDir || buildDir
  const entry = join(buildDir, 'hub/db/schema.entry.ts')
  await build({
    entry: {
      schema: entry
    },
    outDir: join(buildDir, 'hub/db'),
    outExtensions: () => ({
      js: '.mjs',
      dts: '.d.mts'
    }),
    alias: {
      ...alias,
      'hub:db:schema': entry,
      '@nuxthub/db/schema': entry
    },
    // Node builtins bundled from the DB driver (e.g. `postgres`) are already
    // externalized here, but under the `neutral` platform rolldown/esbuild
    // cannot resolve them and floods dev/`db:generate` with UNRESOLVED_IMPORT
    // warnings (os/fs/net/tls/crypto/stream/perf_hooks). The generated
    // schema.mjs is only ever consumed by the Node server, so target `node`:
    // builtins become silent externals with no change to runtime output.
    platform: 'node',
    format: 'esm',
    skipNodeModulesBundle: false,
    tsconfig: false,
    dts: {
      build: false,
      tsconfig: false,
      newContext: true
    },
    clean: false,
    logLevel: 'warn'
  })
  const duration = Date.now() - startTime
  consola.debug(`Database schema built successfully at \`${relative(relativeDir, join(buildDir, 'hub/db/schema.mjs'))}\` (${duration}ms)`)
}
