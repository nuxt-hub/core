import log from 'consola'
import { hubDatabase } from '../database'
import type { HubConfig } from '../../../../../features'
import { AppliedMigrationsQuery, CreateMigrationsTableQuery, getMigrationFiles, splitSqlQueries, useMigrationsStorage } from './helpers'

// Apply migrations during local development and self-hosted remote development.
// See src/utils/migrations/remote.ts for applying migrations on remote development (linked projects) and Pages CI deployments
export async function applyMigrations(hub: HubConfig) {
  const migrationsStorage = useMigrationsStorage(hub)
  const db = hubDatabase()

  const appliedMigrations = (await db.prepare(AppliedMigrationsQuery).all()).results
  const localMigrations = (await getMigrationFiles(hub)).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !appliedMigrations.find(({ name }) => name === localName))
  if (!pendingMigrations.length) return log.success('Database migrations up to date')

  for (const migration of pendingMigrations) {
    let query = await migrationsStorage.getItem<string>(`${migration}.sql`)
    if (!query) continue
    query += `
      ${CreateMigrationsTableQuery}
      INSERT INTO _hub_migrations (name) values ('${migration}');
    `
    const queries = splitSqlQueries(query)

    try {
      await db.batch(queries.map(q => db.prepare(q)))
    } catch (error: any) {
      log.error(`Failed to apply migration \`./server/database/migrations/${migration}.sql\`\n`, error?.message)
      if (error?.message?.includes('already exists')) {
        log.info('If your database already contains the migration, run `npx nuxthub database migrations mark-all-applied` to mark all migrations as applied.')
      }
      break
    }

    log.success(`Database migration \`./server/database/migrations/${migration}.sql\` applied`)
  }
}
