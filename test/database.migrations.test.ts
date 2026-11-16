import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import type { ResolvedHubConfig } from '../src/types'
import { applyDatabaseMigrations } from '../src/db/lib/migrations'

let rootDir: string

beforeEach(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-migrations-'))
  await mkdir(join(rootDir, 'db/migrations'), { recursive: true })
})

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true })
})

function hub(dialect: 'postgresql' | 'sqlite') {
  return { dir: rootDir, db: { dialect } } as ResolvedHubConfig
}

function writeMigration(filename: string, content: string) {
  return writeFile(join(rootDir, 'db/migrations', filename), content)
}

describe('PostgreSQL migrations', () => {
  let client: PGlite
  let db: ReturnType<typeof drizzle>
  let executedQueries: string[]

  beforeEach(() => {
    client = new PGlite()
    executedQueries = []
    db = drizzle(client, { logger: { logQuery: query => executedQueries.push(query) } })
  })

  afterEach(async () => {
    await client.close()
  })

  it('rolls back a failed migration and its history row', async () => {
    await writeMigration('0001_failure.postgresql.sql', `
      CREATE TABLE partially_applied (id integer);
      --> statement-breakpoint
      ALTER TABLE missing_table ADD COLUMN value integer;
    `)

    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(false)

    const result = await client.query(`
      SELECT
        to_regclass('partially_applied') IS NOT NULL AS ddl_applied,
        (SELECT count(*)::int FROM _hub_migrations) AS history_rows
    `)
    expect(result.rows).toEqual([{ ddl_applied: false, history_rows: 0 }])
  })

  it('applies each migration once when runners overlap', async () => {
    await writeMigration('0001_once.postgresql.sql', `
      CREATE FUNCTION migration_value() RETURNS text AS $$
      BEGIN
        RETURN '$nuxthub$';
      END;
      $$ LANGUAGE plpgsql;
      --> statement-breakpoint
      CREATE TABLE applied_once (value text DEFAULT '$nuxthub$');
    `)

    expect(await Promise.all([
      applyDatabaseMigrations(hub('postgresql'), db),
      applyDatabaseMigrations(hub('postgresql'), db)
    ])).toEqual([true, true])

    const lockedQueries = executedQueries.filter(query => query.startsWith('DO '))
    expect(lockedQueries).toHaveLength(4)
    expect(lockedQueries.every(query => query.includes('pg_try_advisory_xact_lock'))).toBe(true)

    const result = await client.query(`
      SELECT
        migration_value() AS function_value,
        (SELECT count(*)::int FROM _hub_migrations) AS history_rows
    `)
    expect(result.rows).toEqual([{ function_value: '$nuxthub$', history_rows: 1 }])
  })

  it('records migration names that contain quotes', async () => {
    await writeMigration('0001_it\'s.postgresql.sql', 'CREATE TABLE quoted (id integer);')

    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(true)

    const result = await client.query('SELECT name FROM _hub_migrations')
    expect(result.rows).toEqual([{ name: '0001_it\'s' }])
  })

  it('runs statements that cannot run in a transaction only from opted-out files', async () => {
    const vacuum = `
      CREATE TABLE vacuumed (id integer);
      --> statement-breakpoint
      VACUUM vacuumed;
    `
    await writeMigration('0001_vacuum.postgresql.sql', vacuum)

    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(false)
    expect((await client.query('SELECT to_regclass(\'vacuumed\') IS NOT NULL AS ddl_applied')).rows).toEqual([{ ddl_applied: false }])

    await writeMigration('0001_vacuum.postgresql.sql', `-- nuxthub:no-transaction${vacuum}`)

    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(true)
    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBeUndefined()
    const result = await client.query(`
      SELECT
        to_regclass('vacuumed') IS NOT NULL AS ddl_applied,
        (SELECT count(*)::int FROM _hub_migrations) AS history_rows
    `)
    expect(result.rows).toEqual([{ ddl_applied: true, history_rows: 1 }])
  })

  it('needs a separate migration to use a new enum value', async () => {
    await writeMigration('0001_enum.postgresql.sql', 'CREATE TYPE status AS ENUM (\'draft\');')
    await writeMigration('0002_enum.postgresql.sql', `
      ALTER TYPE status ADD VALUE 'published';
      --> statement-breakpoint
      CREATE TABLE posts (status status DEFAULT 'published');
    `)

    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(false)

    await writeMigration('0002_enum.postgresql.sql', 'ALTER TYPE status ADD VALUE \'published\';')
    await writeMigration('0003_enum.postgresql.sql', 'CREATE TABLE posts (status status DEFAULT \'published\');')

    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(true)
  })
})

describe('SQLite migrations', () => {
  it('records migration names that contain quotes', async () => {
    const client = createClient({ url: ':memory:' })
    const db = drizzleLibsql(client)
    await writeMigration('0001_it\'s.sqlite.sql', 'CREATE TABLE quoted (id integer);')

    expect(await applyDatabaseMigrations(hub('sqlite'), db)).toBe(true)
    const result = await client.execute('SELECT name FROM _hub_migrations')
    expect(result.rows.map(row => row.name)).toEqual(['0001_it\'s'])
    client.close()
  })
})
