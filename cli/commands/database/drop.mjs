import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { createDrizzleClient } from '../../../dist/module.mjs'
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
      consola.level = 'debug'
    }
    const cwd = args.cwd || process.cwd()
    consola.info('Preparing database configuration...')
    await execa({
      stdout: 'pipe',
      preferLocal: true,
      cwd
    })`nuxt prepare`
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/database/config.json'), 'utf-8'))
    consola.info(`Database dialect: \`${hubConfig.database.dialect}\``)
    const db = await createDrizzleClient(hubConfig.database)
    const execute = hubConfig.database.dialect === 'sqlite' ? 'run' : 'execute'
    await db[execute](sql.raw(`DROP TABLE IF EXISTS "${args.table}";`))
    consola.success(`Table \`${args.table}\` dropped successfully.`)
  }
})
