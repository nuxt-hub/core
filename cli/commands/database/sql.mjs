import { defineCommand } from 'citty'
import { consola } from 'consola'
import { inspect } from 'node:util'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { createDrizzleClient, splitSqlQueries } from '../../../dist/module.mjs'
import { sql } from 'drizzle-orm'

export default defineCommand({
  meta: {
    name: 'sql',
    description: 'Execute a SQL query against the database.'
  },
  args: {
    query: {
      type: 'positional',
      description: 'The SQL query to execute. If not provided, reads from stdin.',
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
    const cwd = args.cwd || process.cwd()
    consola.info('Preparing database configuration...')
    await execa({
      stdio: 'pipe',
      preferLocal: true,
      cwd
    })`nuxt prepare`
    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/database/config.json'), 'utf-8'))
    const dialect = hubConfig.database.dialect
    consola.info(`Database: \`${dialect}\` with \`${hubConfig.database.driver}\` driver`)
    const url = hubConfig.database.connection.uri || hubConfig.database.connection.url
    consola.debug(`Database connection: \`${url}\``)
    const db = await createDrizzleClient(hubConfig.database)

    // Read query from stdin if not provided as argument
    let queryInput = args.query
    if (!queryInput) {
      if (process.stdin.isTTY) {
        consola.error('No query provided. Please provide a query as an argument or pipe SQL from stdin.')
        process.exit(1)
      }
      consola.debug('Reading SQL from stdin...')
      const chunks = []
      for await (const chunk of process.stdin) {
        chunks.push(chunk)
      }
      queryInput = Buffer.concat(chunks).toString('utf-8').trim()
      if (!queryInput) {
        consola.error('No SQL content received from stdin.')
        process.exit(1)
      }
    }

    const queries = splitSqlQueries(queryInput)
    const execute = dialect === 'sqlite' ? 'run' : 'execute'
    const getRows = result => (dialect === 'mysql' ? result[0] : result.rows || result)
    for (const query of queries) {
      const result = await db[execute](sql.raw(query)).catch((err) => {
        consola.error(`Error executing query \`${query}\`: ${err.cause?.message || err.message}`)
        process.exit(1)
      })
      const rows = getRows(result)
      const q = query.toLowerCase().trim()
      if (q.startsWith('select')) {
        consola.success(`${rows.length} row${rows.length === 1 ? '' : 's'} selected by \`${query}\``)
        consola.log(inspect(rows, { depth: null, colors: true, compact: true }))
      } else if (q.startsWith('insert') || q.startsWith('update') || q.startsWith('delete')) {
        consola.success(`\`${query}\``)
      } else if (q.startsWith('create table')) {
        consola.success(`Table created by \`${query}\``)
      } else if (q.startsWith('alter table')) {
        consola.success(`Table altered by \`${query}\``)
      } else if (q.startsWith('drop table')) {
        consola.success(`Table dropped by \`${query}\``)
      } else if (q.startsWith('create index')) {
        consola.success(`Index created by \`${query}\``)
      } else if (q.startsWith('drop index')) {
        consola.success(`Index dropped by \`${query}\``)
      } else {
        consola.success(`Query executed by \`${query}\``)
      }
    }
    await db.$client?.end?.()
  }
})
