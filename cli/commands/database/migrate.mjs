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
      consola.level = 'debug'
    }
    const cwd = args.cwd || process.cwd()
    consola.info('Ensuring database schema is generated...')
    await execa({
      stdout: 'pipe',
      preferLocal: true,
      cwd
    })`nuxt prepare`
    consola.info('Applying database migrations...')
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/database/config.json'), 'utf-8'))
    const db = await createDrizzleClient(hubConfig.database)
    const migrationsApplied = await applyDatabaseMigrations(hubConfig, db)
    if (migrationsApplied === false) {
      process.exit(1)
    }
    const queriesApplied = await applyDatabaseQueries(hubConfig, db)
    if (queriesApplied === false) {
      process.exit(1)
    }
  }
})
