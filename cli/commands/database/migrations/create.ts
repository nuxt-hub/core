import { defineCommand } from 'citty'
import { consola } from 'consola'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'pathe'
import { getNextMigrationNumber } from '../../../utils/database'

export default defineCommand({
  meta: {
    name: 'create',
    description: 'Create a new blank database migration file.'
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the migration.',
      required: true
    }
  },
  async run({ args }) {
    const nextMigrationNumber = await getNextMigrationNumber()
    const name = args.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, '') // remove special characters except spaces, newlines and dashes
      .replace(/\s+/g, '-') // replace spaces and newlines with dashes
      .replace(/^-+/, '') // remove leading and trailing dashes
      .replace(/-+/g, '-') // replace multiple dashes with a single dash
      || 'migration'
    const migrationName = `${nextMigrationNumber}_${name}.sql`
    const userMigrationsDir = join(process.cwd(), 'server/database/migrations')
    await mkdir(userMigrationsDir, { recursive: true })
    await writeFile(join(userMigrationsDir, migrationName), `-- Migration number: ${nextMigrationNumber} \t ${new Date().toISOString()}\n`)

    consola.success(`Created migration file \`server/database/migrations/${migrationName}\``)
  }
})
