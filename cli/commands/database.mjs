import { defineCommand } from 'citty'
import generate from './database/generate.mjs'
import migrate from './database/migrate.mjs'

export default defineCommand({
  meta: {
    name: 'database',
    description: 'Manage database migrations.',
    aliases: ['db']
  },
  subCommands: {
    generate,
    migrate
  }
})
