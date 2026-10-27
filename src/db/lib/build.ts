import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { isBuiltin } from 'node:module'
import { isAbsolute, join, relative, resolve } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import type { Nitro } from 'nitropack'
import type { ResolvedHubConfig } from '@nuxthub/core'
import { consola } from 'consola'
import { createDrizzleClient } from './client'
import { applyDatabaseMigrations, applyDatabaseQueries } from './migrations'
import { resolveTypescriptVersion, supportsDtsGeneration } from './ts-version'
import { build, type Rolldown } from 'tsdown'

const log = consola.withTag('nuxt:hub')

const generateDts = supportsDtsGeneration(resolveTypescriptVersion())

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

// Bump when a change to the build options below changes the generated declarations
const SCHEMA_TYPES_CACHE_VERSION = 1

interface SchemaTypesInputs {
  /** Local files that the JS and declaration builds read */
  files: string[]
  /** External packages that the builds import */
  packages: string[]
  /** Keys of the aliases that the builds import (Nuxt aliases such as `#app-manifest` change on every build, so only these are hashed) */
  aliases: string[]
}

async function hashSchemaTypesInputs({ files, packages, aliases }: SchemaTypesInputs, buildDir: string, alias: Record<string, string>) {
  const hash = createHash('sha256').update(JSON.stringify([SCHEMA_TYPES_CACHE_VERSION, resolveTypescriptVersion(), aliases.map(key => [key, alias[key]])]))
  for (const name of packages) {
    // tsc expands types from these packages into the declarations, so an upgrade can change them
    const version = await readPackageJSON(name, { url: buildDir }).then(pkg => pkg.version, () => undefined)
    hash.update(`\0${name}@${version}`)
  }
  for (const file of files) {
    hash.update(`\0${file}\0`).update(await readFile(file).catch(() => '\0missing'))
  }
  return hash.digest('hex')
}

/**
 * Builds `hub/db/schema.mjs` and `hub/db/schema.d.mts`.
 * Generating the declarations runs `tsc`, which takes most of the build time, so they are
 * cached in `<buildDir>/cache` (which Nuxt keeps when it clears the build directory) and
 * only generated again when a file or package that they depend on changes.
 */
export async function buildDatabaseSchema(buildDir: string, { relativeDir, alias }: { relativeDir?: string, alias?: Record<string, string> } = {}) {
  const startTime = Date.now()
  relativeDir = relativeDir || buildDir
  const entry = join(buildDir, 'hub/db/schema.entry.ts')
  const buildAlias: Record<string, string> = {
    ...alias,
    'hub:db:schema': entry,
    '@nuxthub/db/schema': entry
  }
  const typesPath = join(buildDir, 'hub/db/schema.d.mts')
  const cacheDir = join(buildDir, 'cache/nuxthub/db')
  const cachedTypesPath = join(cacheDir, 'schema.d.mts')
  const cacheMetaPath = join(cacheDir, 'schema.d.mts.json')

  let typesCached = false
  if (generateDts) {
    const cached: (SchemaTypesInputs & { hash: string }) | undefined = await readFile(cacheMetaPath, 'utf8').then(JSON.parse, () => undefined)
    typesCached = !!cached && existsSync(cachedTypesPath) && cached.hash === await hashSchemaTypesInputs(cached, buildDir, buildAlias)
  }
  const buildTypes = generateDts && !typesCached

  const files = new Set<string>()
  const packages = new Set<string>()
  const specifiers = new Set<string>()
  const collectInputs: Rolldown.Plugin = {
    name: 'nuxthub:schema-types-inputs',
    // Plugins see import specifiers before aliases are applied
    resolveId(source) {
      specifiers.add(source)
    },
    buildEnd() {
      for (const id of this.getModuleIds()) {
        if (isAbsolute(id)) {
          // Skips the virtual `.d.ts` modules of the declaration build
          if (existsSync(id)) files.add(id)
        } else if (!isBuiltin(id) && !id.startsWith('\0')) {
          // A bare specifier is an external package import, such as `drizzle-orm/sqlite-core`
          packages.add(id.split('/').slice(0, id.startsWith('@') ? 2 : 1).join('/'))
        }
      }
    }
  }

  await build({
    entry: {
      schema: entry
    },
    outDir: join(buildDir, 'hub/db'),
    outExtensions: () => ({
      js: '.mjs',
      dts: '.d.mts'
    }),
    alias: buildAlias,
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
    dts: buildTypes
      ? {
          build: false,
          tsconfig: false,
          newContext: true
        }
      : false,
    plugins: buildTypes ? [collectInputs] : [],
    clean: false,
    logLevel: 'warn'
  })

  if (typesCached) {
    await copyFile(cachedTypesPath, typesPath)
  } else if (buildTypes && existsSync(typesPath)) {
    const aliases = Object.keys(buildAlias).filter(key => [...specifiers].some(source => source === key || source.startsWith(`${key}/`)))
    const inputs: SchemaTypesInputs = { files: [...files].sort(), packages: [...packages].sort(), aliases: aliases.sort() }
    await mkdir(cacheDir, { recursive: true })
    await copyFile(typesPath, cachedTypesPath)
    await writeFile(cacheMetaPath, JSON.stringify({ hash: await hashSchemaTypesInputs(inputs, buildDir, buildAlias), ...inputs }))
  }
  const duration = Date.now() - startTime
  consola.debug(`Database schema built successfully at \`${relative(relativeDir, join(buildDir, 'hub/db/schema.mjs'))}\`${typesCached ? ' with cached types' : ''} (${duration}ms)`)
}
