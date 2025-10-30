import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'

export default defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate database migrations from the schema.'
  },
  args: {
    cwd: {
      type: 'option',
      description: 'The directory to run the command in.',
      required: false
    }
  },
  async run({ args }) {
    const options = {
      stdout: 'pipe',
      preferLocal: true,
      cwd: args.cwd || process.cwd()
    }
    consola.info('Ensuring database schema is generated...')
    await execa(options)`nuxt prepare`
    consola.info('Generating database migrations...')
    await execa(options)`drizzle-kit generate --config=./.nuxt/hub/database/drizzle.config.ts`
    consola.success('Database migrations generated successfully.')
    consola.log('Start your development server or run `npx nuxthub database migrate` to apply the migrations.')
  }
})
