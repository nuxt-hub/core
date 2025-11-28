import { defineCommand } from 'citty'
import generate from './db/generate.mjs'
import migrate from './db/migrate.mjs'
import markAsMigrated from './db/mark-as-migrated.mjs'
import drop from './db/drop.mjs'
import sql from './db/sql.mjs'

export default defineCommand({
  meta: {
    name: 'db',
    description: 'Manage database migrations and run SQL queries.'
  },
  subCommands: {
    generate,
    migrate,
    'mark-as-migrated': markAsMigrated,
    drop,
    sql
  }
})
