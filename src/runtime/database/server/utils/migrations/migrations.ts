import log from 'consola'
import { hubDatabase } from '../database'
import type { HubConfig } from '../../../../../features'
import { AppliedDatabaseMigrationsQuery, CreateDatabaseMigrationsTableQuery, getDatabaseMigrationFiles, getDatabaseQueryFiles, splitSqlQueries, useDatabaseMigrationsStorage, useDatabaseQueriesStorage } from './helpers'

// Apply migrations during local development and self-hosted remote development.
// See src/utils/migrations/remote.ts for applying migrations on remote development (linked projects) and Pages CI deployments
export async function applyDatabaseMigrations(hub: HubConfig) {
  const migrationsStorage = useDatabaseMigrationsStorage(hub)
  const db = hubDatabase()

  await db.prepare(CreateDatabaseMigrationsTableQuery).all()
  const appliedMigrations = (await db.prepare(AppliedDatabaseMigrationsQuery).all()).results
  const localMigrations = (await getDatabaseMigrationFiles(hub)).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !appliedMigrations.find(({ name }) => name === localName))
  if (!pendingMigrations.length) return log.success('Database migrations up to date')

  for (const migration of pendingMigrations) {
    let query = await migrationsStorage.getItem<string>(`${migration}.sql`)
    if (!query) continue
    query += `
      INSERT INTO _hub_migrations (name) values ('${migration}');
    `
    const queries = splitSqlQueries(query)

    try {
      await db.batch(queries.map(q => db.prepare(q)))
    } catch (error: any) {
      log.error(`Failed to apply migration \`.data/hub/database/migrations/${migration}.sql\`\n`, error?.message)
      if (error?.message?.includes('already exists')) {
        log.info('If your database already contains the migration, run `npx nuxthub database migrations mark-all-applied` to mark all migrations as applied.')
      }
      break
    }

    log.success(`Database migration \`.data/hub/database/migrations/${migration}.sql\` applied`)
  }
}

// Apply migrations during local development and self-hosted remote development.
// See src/utils/migrations/remote.ts for applying migrations on remote development (linked projects) and Pages CI deployments
export async function applyDatabaseQueries(hub: HubConfig) {
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const db = hubDatabase()

  const queriesPaths = await getDatabaseQueryFiles(hub)
  if (!queriesPaths.length) return log.success('No database queries to apply')

  for (const queryPath of queriesPaths) {
    const sql = await queriesStorage.getItem<string>(queryPath)
    if (!sql) continue
    const queries = splitSqlQueries(sql)
    try {
      await db.batch(queries.map(q => db.prepare(q)))
    } catch (error: any) {
      log.error(`Failed to apply query \`.data/hub/database/queries/${queryPath}\`\n`, error?.message)
      break
    }

    log.success(`Database query \`.data/hub/database/queries/${queryPath}\` applied`)
  }
}
