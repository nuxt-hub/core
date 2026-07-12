import { defineCommand } from 'citty'
import { consola } from 'consola'
import { x } from 'tinyexec'
import { join, resolve } from 'pathe'
import { buildDatabaseSchema } from '@nuxthub/core/db'
import { getTsconfigAliases } from '../../utils/db.mjs'

export default defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate database migrations from the schema.'
  },
  args: {
    custom: {
      type: 'boolean',
      description: 'Whether to generate an empty migration file for custom SQL.',
      required: false
    },
    name: {
      type: 'string',
      description: 'Custom name for the migration file.',
      required: false
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
    const cwd = args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd()
    consola.info('Ensuring database schema is generated...')
    await x('nuxt', ['prepare'], { nodeOptions: { cwd } })
    const alias = await getTsconfigAliases(cwd)
    await buildDatabaseSchema(join(cwd, '.nuxt'), { relativeDir: cwd, alias })
    consola.info('Generating database migrations...')
    const drizzleArgs = ['generate', '--config=./.nuxt/hub/db/drizzle.config.ts']
    if (args.custom) drizzleArgs.push('--custom')
    if (args.name) drizzleArgs.push(`--name=${args.name}`)
    const { stderr } = await x('drizzle-kit', drizzleArgs, {
      nodeOptions: { cwd, stdio: ['inherit', 'inherit', 'pipe'] }
    })
    // Drizzle-kit does not exit with an error code when there is an error, so we need to check the stderr
    if (stderr) {
      consola.error(stderr)
      process.exit(1)
    }
    consola.success('Database migrations generated successfully.')
    consola.info('Run `npx nuxt dev` or run `npx nuxt db migrate` to apply the migrations.')
  }
})
