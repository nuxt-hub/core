import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'pathe'
import { createDrizzleClient } from '@nuxthub/core/db'
import { sql } from 'drizzle-orm'
import { loadDotenv, dotenvArg } from '../../utils/dotenv.mjs'

/**
 * Get the query to list all tables based on the database dialect
 */
function getListTablesQuery(dialect) {
  switch (dialect) {
    case 'sqlite':
    case 'libsql':
      return `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';`
    case 'postgresql':
      return `SELECT tablename as name FROM pg_tables WHERE schemaname = 'public';`
    case 'mysql':
      return `SELECT table_name as name FROM information_schema.tables WHERE table_schema = DATABASE();`
    default:
      throw new Error(`Unsupported database dialect: ${dialect}`)
  }
}

export default defineCommand({
  meta: {
    name: 'reset',
    description: 'Reset the database by dropping all tables and deleting migration files.'
  },
  args: {
    cwd: {
      type: 'option',
      description: 'The directory to run the command in.',
      required: false
    },
    dotenv: dotenvArg,
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
    await loadDotenv({ cwd, dotenv: args.dotenv })

    consola.warn(`This command will drop all tables and delete all migration files. ALL DATA STORED IN THE DATABASE WILL BE LOST!`)

    const confirmation = await consola.prompt('Type "confirm" to reset the database:', {
      type: 'text',
      placeholder: 'confirm',
      cancel: 'null'
    })

    if (confirmation !== 'confirm') {
      consola.info('Database reset cancelled.')
      return
    }

    consola.info('Preparing database configuration...')
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

    const hubDir = join(cwd, hubConfig.dir)
    const db = await createDrizzleClient(hubConfig.db, hubDir)
    const execute = dialect === 'sqlite' ? 'run' : 'execute'
    const getRows = result => (dialect === 'mysql' ? result[0] : result.results || result.rows || result) || []
    const closeDb = async () => await db.$client?.end?.()

    // Get list of all tables
    consola.info('Fetching database tables...')
    const listTablesQuery = getListTablesQuery(dialect)
    let tables = []
    try {
      const result = await db[execute](sql.raw(listTablesQuery))
      tables = getRows(result).map(row => row.name || row.table_name || row.tablename || Object.values(row)[0])
    } catch (error) {
      consola.debug('No tables found or error fetching tables:', error.message)
    }

    if (tables.length === 0) {
      consola.info('No tables found in the database.')
    } else {
      consola.info(`Found ${tables.length} table${tables.length === 1 ? '' : 's'} to drop`)

      // Drop all tables
      for (const table of tables) {
        try {
          consola.debug(`Dropping table \`${table}\`...`)
          await db[execute](sql.raw(`DROP TABLE IF EXISTS "${table}";`))
          consola.success(`Dropped table \`${table}\``)
        } catch (error) {
          consola.error(`Failed to drop table \`${table}\`: ${error.message}`)
        }
      }
    }

    await closeDb()

    // Delete migration files
    consola.info('Deleting migration files...')
    const migrationsDirs = hubConfig.db.migrationsDirs || []
    let deletedMigrations = false

    for (const migrationsDir of migrationsDirs) {
      try {
        await rm(migrationsDir, { recursive: true, force: true })
        consola.success(`Deleted migrations directory: \`${migrationsDir}\``)
        deletedMigrations = true
      } catch (error) {
        consola.debug(`No migrations directory at \`${migrationsDir}\` or error deleting: ${error.message}`)
      }
    }

    if (!deletedMigrations) {
      consola.info('No migration files found to delete.')
    }

    consola.success('Database reset complete!')
    consola.info('You can regenerate migrations with `npx nuxt db generate`')
  }
})
