import { consola } from 'consola'
import { join, relative } from 'pathe'
import { sql } from 'drizzle-orm'
import type { ResolvedHubConfig } from '../../../../../types'
import { AppliedDatabaseMigrationsQuery, getCreateMigrationsTableQuery, getDatabaseMigrationFiles, getDatabaseQueryFiles, splitSqlQueries, useDatabaseMigrationsStorage, useDatabaseQueriesStorage } from './helpers'

function getRelativePath(fullPath: string) {
  return relative(process.cwd(), fullPath)
}

export async function applyDatabaseMigrations(hub: ResolvedHubConfig, db: any) {
  if (!hub.database) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')

  const migrationsStorage = useDatabaseMigrationsStorage(hub)
  const execute = hub.database.dialect === 'sqlite' ? 'run' : 'execute'

  const createMigrationsTableQuery = getCreateMigrationsTableQuery({ dialect: hub.database.dialect })
  log.debug('Creating migrations table if not exists...')
  await db[execute](sql.raw(createMigrationsTableQuery))
  log.debug('Successfully created migrations table if not exists')

  const appliedMigrations = await db[execute](sql.raw(AppliedDatabaseMigrationsQuery))
  const appliedRows = appliedMigrations.rows || appliedMigrations || []
  if (!import.meta.dev) {
    log.info(`Found ${appliedRows.length} applied migration${appliedRows.length === 1 ? '' : 's'}`)
  }

  const localMigrations = await getDatabaseMigrationFiles(hub)
  const pendingMigrations = localMigrations.filter(migration => !appliedRows.find((row: any) => {
    const name = row.name || row[1] // Handle both object and array responses
    return name === migration.name
  }))
  if (!pendingMigrations.length) {
    !import.meta.dev && log.success('Database migrations up to date')
    return
  }

  for (const migration of pendingMigrations) {
    let query = await migrationsStorage.getItem<string>(migration.filename)
    if (!query) continue
    query += `\nINSERT INTO _hub_migrations (name) values ('${migration.name}');`
    const queries = splitSqlQueries(query)

    try {
      log.debug(`Applying database migration \`${getRelativePath(join(hub.dir!, 'database/migrations', migration.filename))}\`...`)
      for (const query of queries) {
        await db[execute](sql.raw(query))
      }
    } catch (error: any) {
      const message = error.cause?.message || error.message
      log.error(`Failed to apply migration \`${getRelativePath(join(hub.dir!, 'database/migrations', migration.filename))}\`\n${message}`)
      if (message?.includes('already exists')) {
        log.info(`To mark this migration as applied, run \`npx nuxthub database mark-as-migrated ${migration.name}\``)
        log.info('To drop a table, run `npx nuxthub database drop <table-name>`')
      }
      return false
    }

    log.success(`Database migration \`${getRelativePath(join(hub.dir!, 'database/migrations', migration.filename))}\` applied`)
  }
  !import.meta.dev && log.success('Database migrations applied successfully.')
  return true
}

export async function applyDatabaseQueries(hub: ResolvedHubConfig, db: any) {
  if (!hub.database) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const queriesFiles = await getDatabaseQueryFiles(hub)
  if (!queriesFiles.length) return
  const execute = hub.database.dialect === 'sqlite' ? 'run' : 'execute'

  for (const queryFile of queriesFiles) {
    const sqlQuery = await queriesStorage.getItem<string>(queryFile.filename)
    if (!sqlQuery) continue
    const queries = splitSqlQueries(sqlQuery)
    try {
      log.debug(`Applying database query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\`...`)
      for (const query of queries) {
        await db[execute](sql.raw(query))
      }
    } catch (error: any) {
      log.error(`Failed to apply query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\`\n`, error?.message)
      return false
    }

    !import.meta.dev && log.success(`Database query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\` applied`)
  }
  !import.meta.dev && log.success('Database queries applied successfully.')
  return true
}
