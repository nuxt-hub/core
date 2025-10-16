import { consola } from 'consola'
import { join, relative } from 'pathe'
import type { HubConfig } from '../../../../../features'
import { AppliedDatabaseMigrationsQuery, getCreateMigrationsTableQuery, getDatabaseMigrationFiles, getDatabaseQueryFiles, splitSqlQueries, useDatabaseMigrationsStorage, useDatabaseQueriesStorage } from './helpers'
import type { Database } from 'db0'

const log = consola.withTag('nuxt:hub')

function getRelativePath(fullPath: string) {
  return relative(process.cwd(), fullPath)
}

export async function applyDatabaseMigrations(hub: HubConfig, db: Database) {
  const migrationsStorage = useDatabaseMigrationsStorage(hub)

  const createMigrationsTableQuery = getCreateMigrationsTableQuery(db)
  log.debug('Creating migrations table if not exists...')
  await db.prepare(createMigrationsTableQuery).run()
  log.debug('Successfully created migrations table if not exists')

  const appliedMigrations = await db.prepare(AppliedDatabaseMigrationsQuery).all()
  if (!import.meta.dev) {
    log.info(`Found ${appliedMigrations.length} applied migration${appliedMigrations.length === 1 ? '' : 's'}`)
  }

  const localMigrations = await getDatabaseMigrationFiles(hub)
  const pendingMigrations = localMigrations.filter((migration) => !appliedMigrations.find(({ name }: any) => name === migration.name))
  if (!pendingMigrations.length) return log.success('Database migrations up to date')

  for (const migration of pendingMigrations) {
    let query = await migrationsStorage.getItem<string>(migration.filename)
    if (!query) continue
    query += `\nINSERT INTO _hub_migrations (name) values ('${migration.name}');`
    const queries = splitSqlQueries(query)

    try {
      log.debug(`Applying database migration \`${getRelativePath(join(hub.dir!, 'database/migrations', migration.filename))}\`...`)
      for (const query of queries) {
        await db.prepare(query).run()
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

export async function applyDatabaseQueries(hub: HubConfig, db: Database) {
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const queriesFiles = await getDatabaseQueryFiles(hub)
  if (!queriesFiles.length) return

  for (const queryFile of queriesFiles) {
    const sql = await queriesStorage.getItem<string>(queryFile.filename)
    if (!sql) continue
    const queries = splitSqlQueries(sql)
    try {
      log.debug(`Applying database query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\`...`)
      for (const query of queries) {
        await db.prepare(query).run()
      }
    } catch (error: any) {
      log.error(`Failed to apply query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\`\n`, error?.message)
      break
    }

    log.success(`Database query \`${getRelativePath(join(hub.dir!, 'database/queries', queryFile.filename))}\` applied`)
  }
}
