import consola from 'consola'
import { appliedMigrationsQuery, createMigrationsTableQuery, getMigrationFiles, useMigrationsStorage } from '../../../../utils/migrations/helpers'
import { hubDatabase } from './database'

const log = consola.withTag('nuxt:hub')

export const applyMigrations = async () => {
  const srcStorage = useMigrationsStorage()
  const db = hubDatabase()

  await db.prepare(createMigrationsTableQuery).run() // create migrations table

  log.info('Checking for pending migrations')
  const remoteMigrations = (await db.prepare(appliedMigrationsQuery).all()).results
  if (!remoteMigrations.length) log.warn(`No applied migrations on \`dev\``)

  const localMigrations = (await getMigrationFiles()).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !remoteMigrations.find(({ name }) => name === localName))
  if (!pendingMigrations.length) return log.info('No pending migrations to apply')

  log.info('Applying migrations...')
  for (const migration of pendingMigrations) {
    const migrationFile = await srcStorage.getItemRaw(`${migration}.sql`)
    let query = migrationFile.toString()

    if (query.at(-1) !== ';') query += ';' // ensure previous statement ended before running next query
    query += `
      INSERT INTO hub_migrations (name) values ('${migration}');
    `

    try {
      await db.exec(query)
    } catch (error: any) {
      log.error(`Failed to apply migration \`${migration}\``)
      if (error && error.response) log.error(error?.message || error)
      break
    }

    log.success(`Applied migration \`${migration}\``)
  }
}
