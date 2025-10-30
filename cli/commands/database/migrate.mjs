import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { applyDatabaseMigrations, createDrizzleClient } from '../../../dist/module.mjs'

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
    }
  },
  async run({ args }) {
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
    await applyDatabaseMigrations(hubConfig, db)
    consola.success('Database migrations applied successfully.')
  }
})
