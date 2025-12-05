import { consola } from 'consola'
import { join, relative } from 'pathe'
import type { ResolvedHubConfig } from '../../types/config'
import { AppliedDatabaseMigrationsQuery, getCreateMigrationsTableQuery, splitSqlQueries } from './utils'
import { useDatabaseMigrationsStorage, getDatabaseMigrationFiles, useDatabaseQueriesStorage, getDatabaseQueryFiles } from './storage'

function getRelativePath(fullPath: string) {
  return relative(process.cwd(), fullPath)
}

export async function applyDatabaseMigrations(hub: ResolvedHubConfig, db: any) {
  if (!hub.db) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')

  const migrationsStorage = useDatabaseMigrationsStorage(hub)
  const dialect = hub.db.dialect
  const execute = dialect === 'sqlite' ? 'run' : 'execute'
  const getRows = (result: any) => (dialect === 'mysql' ? result[0] : result.rows || result)

  const createMigrationsTableQuery = getCreateMigrationsTableQuery({ dialect: hub.db.dialect })
  log.debug('Creating migrations table if not exists...')
  const drizzleOrmPkg = 'drizzle-orm'
  const sql = await import(drizzleOrmPkg).then(m => m.sql)
  try {
    await db[execute](sql.raw(createMigrationsTableQuery))
  } catch (error: any) {
    const message = error.cause?.message || error.message
    log.error(`Failed to create migrations table\n${message}`)
    return false
  }
  log.debug('Successfully created migrations table if not exists')

  let appliedRows = []
  try {
    appliedRows = getRows(await db[execute](sql.raw(AppliedDatabaseMigrationsQuery)))
  } catch (error: any) {
    const message = error.cause?.message || error.message
    log.error(`Failed to fetch applied migrations\n${message}`)
    return false
  }
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
      log.debug(`Applying database migration \`${getRelativePath(join(hub.dir!, 'db/migrations', migration.filename))}\`...`)
      for (const query of queries) {
        await db[execute](sql.raw(query))
      }
    } catch (error: any) {
      const message = error.cause?.message || error.message
      log.error(`Failed to apply migration \`${getRelativePath(join(hub.dir!, 'db/migrations', migration.filename))}\`\n${message}`)
      if (message?.includes('already exists')) {
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

export async function applyDatabaseQueries(hub: ResolvedHubConfig, db: any) {
  if (!hub.db) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const queriesFiles = await getDatabaseQueryFiles(hub)
  if (!queriesFiles.length) return
  const execute = hub.db.dialect === 'sqlite' ? 'run' : 'execute'

  for (const queryFile of queriesFiles) {
    const sqlQuery = await queriesStorage.getItem<string>(queryFile.filename)
    if (!sqlQuery) continue
    const queries = splitSqlQueries(sqlQuery)
    const drizzleOrmPkg = 'drizzle-orm'
    const sql = await import(drizzleOrmPkg).then(m => m.sql)
    try {
      log.debug(`Applying database query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\`...`)
      for (const query of queries) {
        await db[execute](sql.raw(query))
      }
    } catch (error: any) {
      const message = error.cause?.message || error.message
      log.error(`Failed to apply query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\`\n${message}`)
      return false
    }

    !import.meta.dev && log.success(`Database query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\` applied`)
  }
  !import.meta.dev && log.success('Database queries applied successfully.')
  return true
}
