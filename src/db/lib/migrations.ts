import { consola } from 'consola'
import { join, relative } from 'pathe'
import type { ResolvedHubConfig } from '@nuxthub/core'
import { AppliedDatabaseMigrationsQuery, getCreateMigrationsTableQuery, splitSqlQueries } from './utils'
import { useDatabaseMigrationsStorage, getDatabaseMigrationFiles, useDatabaseQueriesStorage, getDatabaseQueryFiles } from './storage'

interface DbExecutor {
  executeRaw: (query: string) => Promise<unknown>
  getRows?: (result: unknown) => unknown[]
}

/** Escape single quotes in SQL string literals to prevent injection */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, '\'\'')
}

/** Extract error message from unknown error */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause
    if (cause instanceof Error) return cause.message
    return error.message
  }
  return String(error)
}

/** Type for migration row results (handles both object and array formats) */
type MigrationRow = { name: string } | [unknown, string]

function getRelativePath(fullPath: string) {
  return relative(process.cwd(), fullPath)
}

export async function applyDatabaseMigrations(hub: ResolvedHubConfig, executor: DbExecutor) {
  if (!hub.db) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')

  const migrationsStorage = useDatabaseMigrationsStorage(hub)
  const { executeRaw, getRows = (r: unknown) => (r as unknown[]) || [] } = executor

  const createMigrationsTableQuery = getCreateMigrationsTableQuery({ dialect: hub.db.dialect })
  log.debug('Creating migrations table if not exists...')
  try {
    await executeRaw(createMigrationsTableQuery)
  } catch (error) {
    log.error(`Failed to create migrations table\n${getErrorMessage(error)}`)
    return false
  }
  log.debug('Successfully created migrations table if not exists')

  let appliedRows: unknown[] = []
  try {
    appliedRows = getRows(await executeRaw(AppliedDatabaseMigrationsQuery))
  } catch (error) {
    log.error(`Failed to fetch applied migrations\n${getErrorMessage(error)}`)
    return false
  }
  if (!import.meta.dev) {
    log.info(`Found ${appliedRows.length} applied migration${appliedRows.length === 1 ? '' : 's'}`)
  }

  const localMigrations = await getDatabaseMigrationFiles(hub)
  const pendingMigrations = localMigrations.filter(migration => !appliedRows.find((row) => {
    const r = row as MigrationRow
    const name = Array.isArray(r) ? r[1] : r.name
    return name === migration.name
  }))
  if (!pendingMigrations.length) {
    !import.meta.dev && log.success('Database migrations up to date')
    return
  }

  for (const migration of pendingMigrations) {
    let query = await migrationsStorage.getItem<string>(migration.filename)
    if (!query) {
      log.warn(`Migration file \`${migration.filename}\` is empty or could not be read, skipping`)
      continue
    }
    query += `\nINSERT INTO _hub_migrations (name) values ('${escapeSqlString(migration.name)}');`
    const queries = splitSqlQueries(query)

    try {
      log.debug(`Applying database migration \`${getRelativePath(join(hub.dir!, 'db/migrations', migration.filename))}\`...`)
      for (const q of queries) {
        await executeRaw(q)
      }
    } catch (error) {
      const message = getErrorMessage(error)
      log.error(`Failed to apply migration \`${getRelativePath(join(hub.dir!, 'db/migrations', migration.filename))}\`\n${message}`)
      if (message.includes('already exists')) {
        log.info(`To mark this migration as applied, run \`npx nuxt db mark-as-migrated ${migration.name}\``)
        log.info('To drop a table, run `npx nuxt db drop <table-name>`')
      }
      return false
    }

    log.success(`Database migration \`${getRelativePath(join(hub.dir!, 'db/migrations', migration.filename))}\` applied`)
  }
  !import.meta.dev && log.success('Database migrations applied successfully.')
  return true
}

export async function applyDatabaseQueries(hub: ResolvedHubConfig, executor: { executeRaw: (query: string) => Promise<unknown> }) {
  if (!hub.db) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const queriesFiles = await getDatabaseQueryFiles(hub)
  if (!queriesFiles.length) return
  const { executeRaw } = executor

  for (const queryFile of queriesFiles) {
    const sqlQuery = await queriesStorage.getItem<string>(queryFile.filename)
    if (!sqlQuery) {
      log.warn(`Query file \`${queryFile.filename}\` is empty or could not be read, skipping`)
      continue
    }
    const queries = splitSqlQueries(sqlQuery)
    try {
      log.debug(`Applying database query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\`...`)
      for (const q of queries) {
        await executeRaw(q)
      }
    } catch (error) {
      log.error(`Failed to apply query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\`\n${getErrorMessage(error)}`)
      return false
    }

    !import.meta.dev && log.success(`Database query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\` applied`)
  }
  !import.meta.dev && log.success('Database queries applied successfully.')
  return true
}
