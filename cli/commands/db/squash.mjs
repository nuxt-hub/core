import { defineCommand } from 'citty'
import { consola } from 'consola'
import { execa } from 'execa'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { join, resolve } from 'pathe'
import { buildDatabaseSchema, createDrizzleClient } from '@nuxthub/core/db'
import { sql } from 'drizzle-orm'

async function getTsconfigAliases(cwd) {
  try {
    const tsconfig = JSON.parse(await readFile(join(cwd, '.nuxt/tsconfig.json'), 'utf-8'))
    const paths = tsconfig.compilerOptions?.paths || {}
    const alias = {}
    for (const [key, values] of Object.entries(paths)) {
      const resolvedPath = key.endsWith('/*') ? values[0].replace(/\/\*$/, '') : values[0]
      alias[key.replace(/\/\*$/, '')] = resolve(join(cwd, '.nuxt'), resolvedPath)
    }
    return alias
  } catch {
    return {}
  }
}

export default defineCommand({
  meta: {
    name: 'squash',
    description: 'Squash the last X (or selected) migrations into a single migration.'
  },
  args: {
    last: {
      type: 'string',
      description: 'Number of migrations to squash starting from most recently applied. If not specified migrations can be interactively selected.',
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
      consola.level = 4
    }
    const cwd = args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd()
    const execaOptions = {
      stdout: 'pipe',
      stderr: 'pipe',
      preferLocal: true,
      cwd
    }

    // Parse the number of migrations to drop
    const dropCount = args.last ? Number.parseInt(args.last, 10) : null

    if (dropCount !== null && (Number.isNaN(dropCount) || dropCount < 1)) {
      consola.error('Invalid value for --last. Please provide a positive number.')
      process.exit(1)
    }

    // Ensure database schema is ready and get config
    consola.info('Preparing database schema...')
    await execa(execaOptions)`nuxt prepare`

    const hubConfig = JSON.parse(await readFile(join(cwd, '.nuxt/hub/db/config.json'), 'utf-8'))
    const migrationsDir = join(hubConfig.db.migrationsDirs?.[0], hubConfig.db.dialect)

    if (!migrationsDir) {
      consola.error('No migrations directory found in hub config.')
      process.exit(1)
    }

    // Read the journal
    const journalPath = join(migrationsDir, 'meta', '_journal.json')
    let journal
    try {
      journal = JSON.parse(await readFile(journalPath, 'utf-8'))
    } catch {
      consola.error(`Could not read migrations journal at ${journalPath}`)
      process.exit(1)
    }

    if (!journal.entries || journal.entries.length === 0) {
      consola.info('No migrations found to squash.')
      return
    }

    consola.info(`Found ${journal.entries.length} migration${journal.entries.length === 1 ? '' : 's'}`)

    // Determine which migrations to drop
    let migrationsToDrop

    if (dropCount) {
      // Auto-select the last X migrations
      if (dropCount > journal.entries.length) {
        consola.warn(`Only ${journal.entries.length} migration${journal.entries.length === 1 ? '' : 's'} available - squashing all`)
      }
      migrationsToDrop = journal.entries.slice(-Math.min(dropCount, journal.entries.length))
    } else {
      // Interactive multiselect
      const options = journal.entries.map(entry => ({
        value: entry.tag,
        label: entry.tag,
        hint: `${entry.idx}`
      }))

      const selected = await consola.prompt('Select migrations to squash:', {
        type: 'multiselect',
        required: false,
        options,
        cancel: 'null'
      })

      if (!selected || selected.length === 0) {
        consola.info('No migrations selected.')
        return
      }

      // Find the oldest selected migration and include all migrations from that point onwards
      const selectedEntries = journal.entries.filter(entry => selected.includes(entry.tag))
      const oldestSelectedIdx = Math.min(...selectedEntries.map(e => e.idx))
      migrationsToDrop = journal.entries.filter(entry => entry.idx >= oldestSelectedIdx)

      // Warn if we're including additional migrations
      if (migrationsToDrop.length > selected.length) {
        const additionalCount = migrationsToDrop.length - selected.length
        consola.warn(`Including ${additionalCount} additional migration${additionalCount === 1 ? '' : 's'} - all migrations after the oldest selected migration must be squashed.`)
      }
    }

    // Show confirmation
    consola.log('')
    consola.info(`The following ${migrationsToDrop.length} migration${migrationsToDrop.length === 1 ? '' : 's'} will be squashed:`)
    for (const migration of migrationsToDrop) {
      consola.log(`  - ${migration.tag}`)
    }

    const confirmed = await consola.prompt('Confirm squash?', {
      type: 'confirm',
      initial: false,
      cancel: 'null'
    })

    if (confirmed !== true) {
      consola.info('Squash cancelled')
      return
    }

    // Remove the selected migrations
    consola.info('Squashing migrations...')
    const tagsToRemove = new Set(migrationsToDrop.map(m => m.tag))

    for (const migration of migrationsToDrop) {
      const sqlFilePath = join(migrationsDir, `${migration.tag}.sql`)
      const snapshotFilePath = join(migrationsDir, 'meta', `${migration.tag.split('_')[0]}_snapshot.json`)

      try {
        await rm(sqlFilePath, { force: true })
        consola.debug(`Deleted ${sqlFilePath}`)
      } catch (error) {
        consola.debug(`Could not delete ${sqlFilePath}: ${error.message}`)
      }

      try {
        await rm(snapshotFilePath, { force: true })
        consola.debug(`Deleted ${snapshotFilePath}`)
      } catch (error) {
        consola.debug(`Could not delete ${snapshotFilePath}: ${error.message}`)
      }

      consola.success(`Removed migration \`${migration.tag}\``)
    }

    // Update the journal
    const updatedJournal = {
      ...journal,
      entries: journal.entries.filter(entry => !tagsToRemove.has(entry.tag))
    }
    await writeFile(journalPath, JSON.stringify(updatedJournal, null, 2))
    consola.debug('Updated journal file')

    // Build schema and generate fresh migration
    const alias = await getTsconfigAliases(cwd)
    await buildDatabaseSchema(join(cwd, '.nuxt'), { relativeDir: cwd, alias })
    consola.info('Generating new migration...')
    const { stderr } = await execa({
      ...execaOptions,
      stdin: 'inherit',
      stdout: 'inherit'
    })`drizzle-kit generate --config=./.nuxt/hub/db/drizzle.config.ts`

    if (stderr) {
      consola.error(stderr)
      process.exit(1)
    }

    consola.success('Migrations squashed successfully.')

    // Read the updated journal to find the new migration
    const updatedJournalContent = JSON.parse(await readFile(journalPath, 'utf-8'))
    const newMigration = updatedJournalContent.entries[updatedJournalContent.entries.length - 1]

    if (newMigration) {
      const markAsApplied = await consola.prompt(`Mark new migration \`${newMigration.tag}\` as already applied?`, {
        type: 'confirm',
        initial: false,
        cancel: 'null'
      })

      if (markAsApplied === true) {
        const hubDir = join(cwd, hubConfig.dir)
        const db = await createDrizzleClient(hubConfig.db, hubDir)
        const dialect = hubConfig.db.dialect
        const execute = dialect === 'sqlite' ? 'run' : 'execute'
        await db[execute](sql.raw(`INSERT INTO "_hub_migrations" (name) values ('${newMigration.tag}');`))
        await db.$client?.end?.()
        consola.success(`Migration \`${newMigration.tag}\` marked as applied.`)
      } else {
        consola.info(`Run \`npx nuxt dev\` or \`npx nuxt db migrate\` to apply the new migration. Alternatively, to mark the migration as already applied, run \`npx nuxt db mark-as-migrated ${newMigration.tag}\`.`)
      }
    }
  }
})
