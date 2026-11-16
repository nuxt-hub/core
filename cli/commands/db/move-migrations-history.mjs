import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { createDrizzleClient, moveDatabaseMigrationsHistory } from '@nuxthub/core/db'
import { loadDotenv, dotenvArg } from '../../utils/dotenv.mjs'

export default defineCommand({
  meta: {
    name: 'move-migrations-history',
    description: 'Move the PostgreSQL migration history table into `hub.db.migrationsSchema`, or back with --revert.'
  },
  args: {
    revert: {
      type: 'boolean',
      description: 'Move the history from `migrationsSchema` back to the first schema of the search_path.',
      required: false
    },
    schema: {
      type: 'option',
      description: 'The schema to use instead of `hub.db.migrationsSchema`.',
      required: false
    },
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
    consola.info('Preparing database configuration...')
    await execa({
      stdio: 'pipe',
      preferLocal: true,
      cwd
    })`nuxt prepare`
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/db/config.json'), 'utf-8'))
    const dbConfig = { ...hubConfig.db, migrationsSchema: args.schema || hubConfig.db.migrationsSchema }
    consola.info(`Database: \`${dbConfig.dialect}\` with \`${dbConfig.driver}\` driver`)
    const url = dbConfig.connection?.uri || dbConfig.connection?.url
    if (url) consola.debug(`Database connection: \`${url}\``)
    const db = await createDrizzleClient(dbConfig, join(cwd, hubConfig.dir))
    try {
      const moved = await moveDatabaseMigrationsHistory(dbConfig, db, { revert: args.revert })
      if (moved) {
        consola.success(`Moved migration history from \`${moved.from}\` to \`${moved.to}\`.`)
      } else {
        consola.success('Migration history is already in place. Nothing to move.')
      }
    } catch (error) {
      consola.error(error.message)
      process.exitCode = 1
    } finally {
      await db.$client?.end?.()
    }
  }
})
