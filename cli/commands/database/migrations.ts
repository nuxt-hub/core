import { defineCommand } from 'citty'
import create from './migrations/create'
import { consola } from 'consola'

export default defineCommand({
  meta: {
    name: 'migrations',
    description: 'Database migrations commands.'
  },
  async setup() {
    consola.info('Make sure to run `npx nuxi prepare` before running this command if some migrations are missing.')
  },
  subCommands: {
    create
  }
})
