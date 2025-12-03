import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { createDrizzleClient, getDatabaseMigrationFiles, AppliedDatabaseMigrationsQuery } from '@nuxthub/core/db'
import { sql } from 'drizzle-orm'

export default defineCommand({
  meta: {
    name: 'mark-as-migrated',
    description: 'Mark local database migration(s) as applied to the database.'
  },
  args: {
    name: {
      type: 'positional',
      description: 'The name of the migration to mark as applied.',
      required: false
    },
    cwd: {
      type: 'option',
      description: 'The directory to run the command in.',
      required: false
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      description: 'Show verbose output.',
      required: false
    }
  },
  async run({ args }) {
    if (args.verbose) {
      // Set log level to debug
      consola.level = 4
    }
    const cwd = args.cwd || process.cwd()
    consola.info('Ensuring database migrations are available...')
    await execa({
      stdio: 'pipe',
      preferLocal: true,
      cwd
    })`nuxt prepare`
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/db/config.json'), 'utf-8'))
    const dialect = hubConfig.db.dialect
    consola.info(`Database: \`${dialect}\` with \`${hubConfig.db.driver}\` driver`)
    const url = hubConfig.db.connection.uri || hubConfig.db.connection.url
    consola.debug(`Database connection: \`${url}\``)
    const localMigrations = await getDatabaseMigrationFiles(hubConfig)
    if (localMigrations.length === 0) {
      consola.info('No local migrations found.')
      return
    }
    consola.info(`Found \`${localMigrations.length}\` local migration${localMigrations.length === 1 ? '' : 's'}`)
    consola.debug(`Local migrations:\n${localMigrations.map(migration => `- ${migration.name}`).join('\n')}`)
    if (args.name && !localMigrations.find(migration => migration.name === args.name)) {
      consola.error(`Local migration \`${args.name}\` not found.`)
      process.exit(1)
    }
    const hubDir = join(cwd, hubConfig.dir)
    const db = await createDrizzleClient(hubConfig.db, hubDir)
    const execute = dialect === 'sqlite' ? 'run' : 'execute'
    const getRows = result => (dialect === 'mysql' ? result[0] : result.rows || result)
    const closeDb = async () => await db.$client?.end?.()
    const appliedMigrations = getRows(await db[execute](sql.raw(AppliedDatabaseMigrationsQuery)))
    consola.info(`Database has \`${appliedMigrations.length}\` applied migration${appliedMigrations.length === 1 ? '' : 's'}`)
    consola.debug(`Applied migrations:\n${appliedMigrations.map(migration => `- ${migration.name} (\`${migration.applied_at}\`)`).join('\n')}`)
    // If a specific migration is provided, check if it is already applied
    if (args.name && appliedMigrations.find(appliedMigration => appliedMigration.name === args.name)) {
      consola.success(`Local migration \`${args.name}\` is already applied.`)
      return closeDb()
    }
    // If a specific migration is provided, mark it as applied
    if (args.name) {
      await db[execute](sql.raw(`INSERT INTO "_hub_migrations" (name) values ('${args.name}');`))
      consola.success(`Local migration \`${args.name}\` marked as applied.`)
      return closeDb()
    }
    // If no specific migration is provided, mark all pending migrations as applied
    const pendingMigrations = localMigrations.filter(migration => !appliedMigrations.find(appliedMigration => appliedMigration.name === migration.name))
    if (pendingMigrations.length === 0) {
      consola.success('All migrations are already applied.')
      return closeDb()
    }
    consola.info(`Found \`${pendingMigrations.length}\` pending migration${pendingMigrations.length === 1 ? '' : 's'}`)
    let migrationsMarkedAsApplied = 0
    for (const migration of pendingMigrations) {
      const confirmed = await consola.prompt(`Mark migration \`${migration.name}\` as applied?`, {
        type: 'confirm',
        default: true,
        cancel: 'null'
      })
      if (!confirmed) {
        consola.info(`Migration \`${migration.name}\` skipped.`)
        continue
      }
      await db[execute](sql.raw(`INSERT INTO "_hub_migrations" (name) values ('${migration.name}');`))
      consola.success(`Migration \`${migration.name}\` marked as applied.`)
      migrationsMarkedAsApplied++
    }
    if (migrationsMarkedAsApplied === 0) {
      consola.info('No migrations marked as applied.')
      return closeDb()
    }
    consola.success(`${migrationsMarkedAsApplied} migration${migrationsMarkedAsApplied === 1 ? '' : 's'} marked as applied.`)
    return closeDb()
  }
})
