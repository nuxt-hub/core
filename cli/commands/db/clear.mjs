import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
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
    name: 'clear',
    description: 'Clear the database by dropping all tables.'
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
      consola.level = 4
    }
    const cwd = args.cwd || process.cwd()
    await loadDotenv({ cwd, dotenv: args.dotenv })

    consola.warn('This command will drop all tables. ALL DATA STORED IN THE DATABASE WILL BE LOST!')

    const confirmation = await consola.prompt('Type "confirm" to clear the database:', {
      type: 'text',
      placeholder: 'confirm',
      cancel: 'null'
    })

    if (confirmation !== 'confirm') {
      consola.info('Database clear cancelled.')
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

    // PostgreSQL: Drop and recreate all user schemas
    if (dialect === 'postgresql') {
      consola.debug('Fetching database schemas...')
      const getRows = result => result.rows || result || []

      // Get all user-created schemas
      const schemasResult = await db[execute](sql.raw(`
        SELECT schema_name FROM information_schema.schemata
        WHERE schema_name NOT LIKE 'pg_%'
        AND schema_name != 'information_schema';
      `))
      const schemas = getRows(schemasResult).map(row => row.schema_name)

      if (schemas.length === 0) {
        consola.info('No schemas found.')
      } else {
        consola.debug(`Found ${schemas.length} schema${schemas.length === 1 ? '' : 's'} to clear`)

        for (const schema of schemas) {
          try {
            consola.debug(`Dropping schema \`${schema}\`...`)
            await db[execute](sql.raw(`DROP SCHEMA "${schema}" CASCADE;`))
            await db[execute](sql.raw(`CREATE SCHEMA "${schema}";`))
            consola.debug(`Cleared schema \`${schema}\``)
          } catch (error) {
            consola.error(`Failed to clear schema \`${schema}\`: ${error.message}`)
          }
        }
      }

      await db.$client?.end?.()
      consola.success('Database cleared successfully.')
      return
    }

    // SQLite/libsql/MySQL: Drop tables individually
    const getRows = result => (dialect === 'mysql' ? result[0] : result.results || result.rows || result) || []

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

      // Disable foreign key checks to allow dropping tables with relations
      if (dialect === 'sqlite' || dialect === 'libsql') {
        await db[execute](sql.raw('PRAGMA foreign_keys = OFF;'))
      } else if (dialect === 'mysql') {
        await db[execute](sql.raw('SET FOREIGN_KEY_CHECKS = 0;'))
      }

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

      // Re-enable foreign key checks
      if (dialect === 'sqlite' || dialect === 'libsql') {
        await db[execute](sql.raw('PRAGMA foreign_keys = ON;'))
      } else if (dialect === 'mysql') {
        await db[execute](sql.raw('SET FOREIGN_KEY_CHECKS = 1;'))
      }
    }

    await db.$client?.end?.()
    consola.success('Database cleared successfully.')
  }
})
