import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { createDrizzleClient } from '@nuxthub/core/db'
import { sql } from 'drizzle-orm'

export default defineCommand({
  meta: {
    name: 'drop',
    description: 'Drop a table from the database.'
  },
  args: {
    table: {
      type: 'positional',
      description: 'The name of the table to drop.',
      required: true
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
    consola.info('Preparing database configuration...')
    await execa({
      stdio: 'pipe',
      preferLocal: true,
      cwd
    })`nuxt prepare`
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/db/config.json'), 'utf-8'))
    consola.info(`Database: \`${hubConfig.db.dialect}\` with \`${hubConfig.db.driver}\` driver`)
    const url = hubConfig.db.connection.uri || hubConfig.db.connection.url
    consola.debug(`Database connection: \`${url}\``)
    const hubDir = join(cwd, hubConfig.dir)
    const db = await createDrizzleClient(hubConfig.db, hubDir)
    const execute = hubConfig.db.dialect === 'sqlite' ? 'run' : 'execute'
    await db[execute](sql.raw(`DROP TABLE IF EXISTS "${args.table}";`))
    consola.success(`Table \`${args.table}\` dropped successfully.`)
    await db.$client?.end?.()
  }
})
