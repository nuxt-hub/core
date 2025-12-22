import { defineCommand } from 'citty'
import { readFileSync } from 'node:fs'
import generate from './db/generate.mjs'
import migrate from './db/migrate.mjs'
import markAsMigrated from './db/mark-as-migrated.mjs'
import drop from './db/drop.mjs'
import dropAll from './db/drop-all.mjs'
import squash from './db/squash.mjs'
import sql from './db/sql.mjs'

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'))

export default defineCommand({
  meta: {
    name: 'db',
    description: 'Manage NuxtHub database migrations and run SQL queries.',
    version
  },
  subCommands: {
    generate,
    migrate,
    'mark-as-migrated': markAsMigrated,
    drop,
    'drop-all': dropAll,
    squash,
    sql
  }
})
