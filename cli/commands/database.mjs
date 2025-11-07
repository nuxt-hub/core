import { defineCommand } from 'citty'
import generate from './database/generate.mjs'
import migrate from './database/migrate.mjs'
import markAsMigrated from './database/mark-as-migrated.mjs'
import drop from './database/drop.mjs'
import sql from './database/sql.mjs'

export default defineCommand({
  meta: {
    name: 'database',
    description: 'Manage database migrations.',
    aliases: ['db']
  },
  subCommands: {
    generate,
    migrate,
    'mark-as-migrated': markAsMigrated,
    drop,
    sql
  }
})
