import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { applyDatabaseMigrations, applyDatabaseQueries, createDrizzleClient } from '../../../dist/module.mjs'

export default defineCommand({
  meta: {
    name: 'migrate',
    description: 'Apply database migrations to the database.'
  },
  args: {
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
    consola.info('Applying database migrations...')
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/db/config.json'), 'utf-8'))
    consola.info(`Database: \`${hubConfig.db.dialect}\` with \`${hubConfig.db.driver}\` driver`)
    const url = hubConfig.db.connection.uri || hubConfig.db.connection.url
    consola.debug(`Database connection: \`${url}\``)
    const db = await createDrizzleClient(hubConfig.db)
    const migrationsApplied = await applyDatabaseMigrations(hubConfig, db)
    if (migrationsApplied === false) {
      process.exit(1)
    }
    const queriesApplied = await applyDatabaseQueries(hubConfig, db)
    if (queriesApplied === false) {
      process.exit(1)
    }
    await db.$client?.end?.()
  }
})
