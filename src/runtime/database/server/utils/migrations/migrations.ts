import { consola } from 'consola'
import { join, relative } from 'pathe'
import { sql } from 'drizzle-orm'
import type { ResolvedHubConfig } from '../../../../../types'
import { AppliedDatabaseMigrationsQuery, getCreateMigrationsTableQuery, getDatabaseMigrationFiles, getDatabaseQueryFiles, splitSqlQueries, useDatabaseMigrationsStorage, useDatabaseQueriesStorage } from './helpers'

const log = consola.withTag('nuxt:hub')

function getRelativePath(fullPath: string) {
  return relative(process.cwd(), fullPath)
}

export async function applyDatabaseMigrations(hub: ResolvedHubConfig, db: any) {
  if (!hub.database) return
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
  if (!pendingMigrations.length) return log.success('Database migrations up to date')

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
      log.error(`Failed to apply migration \`${getRelativePath(join(hub.dir!, 'database/migrations', migration.filename))}\`\n`, error?.message)
      if (error?.message?.includes('already exists')) {
        log.info('If your database already contains the migration, run `npx nuxthub database migrations mark-all-applied` to mark all migrations as applied.')
      }
      break
    }

    log.success(`Database migration \`${getRelativePath(join(hub.dir!, 'database/migrations', migration.filename))}\` applied`)
  }
}

export async function applyDatabaseQueries(hub: ResolvedHubConfig, db: any) {
  if (!hub.database) return
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
      break
    }

    log.success(`Database query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\` applied`)
  }
}
