import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { join, resolve } from 'pathe'
import { buildDatabaseSchema } from '@nuxthub/core/db'

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
    const cwd = args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd()
    const options = {
      stdout: 'pipe',
      stderr: 'pipe',
      preferLocal: true,
      cwd
    }
    consola.info('Ensuring database schema is generated...')
    await execa(options)`nuxt prepare`
    await buildDatabaseSchema(join(options.cwd, '.nuxt'), { relativeDir: cwd })
    consola.info('Generating database migrations...')
    const { stderr } = await execa({
      ...options,
      stdin: 'inherit',
      stdout: 'inherit'
    })`drizzle-kit generate --config=./.nuxt/hub/db/drizzle.config.ts`
    // Drizzle-kit does not exit with an error code when there is an error, so we need to check the stderr
    if (stderr) {
      consola.error(stderr)
      process.exit(1)
    }
    consola.success('Database migrations generated successfully.')
    consola.info('Run `npx nuxt dev` or run `npx nuxt db migrate` to apply the migrations.')
  }
})
