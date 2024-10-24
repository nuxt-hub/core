import log from 'consola'
import { hubDatabase } from '../database'
import { appliedMigrationsQuery, createMigrationsTableQuery, getMigrationFiles, splitSqlQueries, useMigrationsStorage } from './helpers'
import { useRuntimeConfig } from '#imports'

// Apply migrations during local development and self-hosted remote development.
// See src/utils/migrations/remote.ts for applying migrations on remote development (linked projects) and Pages CI deployments
export const applyMigrations = async () => {
  const srcStorage = useMigrationsStorage()
  const hub = useRuntimeConfig().hub
  const env = hub.remote ? hub.env : 'local'

  const db = hubDatabase()
  await db.prepare(createMigrationsTableQuery).run() // create migrations table

  const appliedMigrations = (await db.prepare(appliedMigrationsQuery).all()).results
  if (!appliedMigrations.length) log.warn(`No applied migrations on \`${env}\``)

  const localMigrations = (await getMigrationFiles()).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !appliedMigrations.find(({ name }) => name === localName))
  if (!pendingMigrations.length) return log.info('No pending migrations to apply')

  for (const migration of pendingMigrations) {
    const migrationFile = await srcStorage.getItemRaw(`${migration}.sql`)
    let query = migrationFile.toString()
    query += `
      INSERT INTO hub_migrations (name) values ('${migration}');
    `
    const queries = splitSqlQueries(query)

    try {
      await db.batch(queries.map(q => db.prepare(q)))
    } catch (error: any) {
      log.error(`Failed to apply migration \`${migration}\``, error?.message || error, { query })
      break
    }

    log.success(`Applied migration \`${migration}\``)
  }
}
