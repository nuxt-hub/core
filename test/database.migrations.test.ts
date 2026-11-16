import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import type { ResolvedHubConfig } from '../src/types'
import { applyDatabaseMigrations, ensureDatabaseMigrationsTable, moveDatabaseMigrationsHistory } from '../src/db/lib/migrations'
import { getMigrationsTableName } from '../src/db/lib/utils'

let rootDir: string

beforeEach(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-migrations-'))
  await mkdir(join(rootDir, 'db/migrations'), { recursive: true })
})

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true })
})

function hub(dialect: 'postgresql' | 'sqlite', migrationsSchema?: string) {
  return { dir: rootDir, db: { dialect, migrationsSchema } } as ResolvedHubConfig
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

describe('PostgreSQL migrationsSchema', () => {
  let client: PGlite
  let db: ReturnType<typeof drizzle>
  let errors: string[]

  beforeEach(() => {
    client = new PGlite()
    db = drizzle(client)
    errors = []
    const log = { debug: vi.fn(), info: vi.fn(), success: vi.fn(), warn: vi.fn(), error: (message: string) => errors.push(message) }
    vi.spyOn(consola, 'withTag').mockReturnValue(log as any)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await client.close()
  })

  const config = (migrationsSchema?: string) => hub('postgresql', migrationsSchema).db!

  async function historyTables() {
    const result = await client.query<{ table: string }>(`SELECT table_schema || '.' || table_name AS table FROM information_schema.tables WHERE table_name = '_hub_migrations' ORDER BY 1`)
    return result.rows.map(row => row.table)
  }

  async function history(table: string) {
    const result = await client.query(`SELECT id, name FROM ${table} ORDER BY id`)
    return result.rows
  }

  it('records the history in the configured schema', async () => {
    await client.exec('CREATE SCHEMA nuxthub')
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE app_table (id integer);')

    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(true)

    expect(await historyTables()).toEqual(['nuxthub._hub_migrations'])
    expect(await history('nuxthub._hub_migrations')).toEqual([{ id: 1, name: '0001_create' }])
    const appTable = await client.query('SELECT to_regclass(\'public.app_table\') IS NOT NULL AS in_public')
    expect(appTable.rows).toEqual([{ in_public: true }])
  })

  it('quotes the schema name', async () => {
    await client.exec('CREATE SCHEMA "hub ""history"""')
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE app_table (id integer);')

    expect(await applyDatabaseMigrations(hub('postgresql', 'hub "history"'), db)).toBe(true)
    expect(await applyDatabaseMigrations(hub('postgresql', 'hub "history"'), db)).toBeUndefined()

    expect(await historyTables()).toEqual(['hub "history"._hub_migrations'])
  })

  it('fails without creating anything when the schema does not exist', async () => {
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE app_table (id integer);')

    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(false)

    expect(errors.join('\n')).toContain('PostgreSQL schema "nuxthub" from `hub.db.migrationsSchema` does not exist. Create it before migrating')
    const result = await client.query(`SELECT to_regnamespace('nuxthub') IS NOT NULL AS schema_exists, to_regclass('app_table') IS NOT NULL AS app_table_exists`)
    expect(result.rows).toEqual([{ schema_exists: false, app_table_exists: false }])
    expect(await historyTables()).toEqual([])
  })

  it('refuses to migrate until the search_path history is moved, then continues without replaying', async () => {
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE app_table (id integer);')
    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(true)
    await client.exec('CREATE SCHEMA nuxthub')
    await writeMigration('0002_insert.postgresql.sql', 'INSERT INTO app_table VALUES (1);')

    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(false)
    expect(errors.join('\n')).toContain('Migration history exists in public._hub_migrations, but `hub.db.migrationsSchema` expects it in "nuxthub"."_hub_migrations". Run `npx nuxt db move-migrations-history`')
    await expect(ensureDatabaseMigrationsTable(config('nuxthub'), db)).rejects.toThrow('Run `npx nuxt db move-migrations-history`')
    expect(await historyTables()).toEqual(['public._hub_migrations'])

    expect(await moveDatabaseMigrationsHistory(config('nuxthub'), db)).toEqual({ from: 'public._hub_migrations', to: '"nuxthub"."_hub_migrations"' })
    expect(await moveDatabaseMigrationsHistory(config('nuxthub'), db)).toBeUndefined()
    expect(await historyTables()).toEqual(['nuxthub._hub_migrations'])

    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(true)
    expect(await history('nuxthub._hub_migrations')).toEqual([{ id: 1, name: '0001_create' }, { id: 2, name: '0002_insert' }])
    const rows = await client.query('SELECT count(*)::int AS count FROM app_table')
    expect(rows.rows).toEqual([{ count: 1 }])
  })

  it('refuses to migrate, mark or move when both history tables exist', async () => {
    await client.exec('CREATE SCHEMA nuxthub')
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE app_table (id integer);')
    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(true)
    await client.exec('CREATE TABLE public._hub_migrations (id serial PRIMARY KEY, name text UNIQUE, applied_at timestamp DEFAULT now() NOT NULL)')
    await writeMigration('0002_insert.postgresql.sql', 'INSERT INTO app_table VALUES (1);')

    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(false)
    expect(errors.join('\n')).toContain('Migration history exists in both public._hub_migrations and "nuxthub"."_hub_migrations". Keep the rows you need in one table and drop the other')
    await expect(ensureDatabaseMigrationsTable(config('nuxthub'), db)).rejects.toThrow('Migration history exists in both')
    await expect(moveDatabaseMigrationsHistory(config('nuxthub'), db)).rejects.toThrow('Migration history exists in both')
    await expect(moveDatabaseMigrationsHistory(config('nuxthub'), db, { revert: true })).rejects.toThrow('Migration history exists in both')
    const rows = await client.query('SELECT count(*)::int AS count FROM app_table')
    expect(rows.rows).toEqual([{ count: 0 }])
  })

  it('accepts a history table that the search_path resolves to the configured schema', async () => {
    await client.exec('CREATE SCHEMA nuxthub; SET search_path TO nuxthub, public')
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE public.app_table (id integer);')
    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(true)

    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBeUndefined()
    expect(await historyTables()).toEqual(['nuxthub._hub_migrations'])
  })

  it('moves the history back to the search_path with revert', async () => {
    await client.exec('CREATE SCHEMA nuxthub')
    await writeMigration('0001_create.postgresql.sql', 'CREATE TABLE app_table (id integer);')
    expect(await applyDatabaseMigrations(hub('postgresql', 'nuxthub'), db)).toBe(true)

    expect(await moveDatabaseMigrationsHistory(config('nuxthub'), db, { revert: true })).toEqual({ from: '"nuxthub"."_hub_migrations"', to: '"public"."_hub_migrations"' })
    expect(await moveDatabaseMigrationsHistory(config('nuxthub'), db, { revert: true })).toBeUndefined()
    expect(await historyTables()).toEqual(['public._hub_migrations'])

    await writeMigration('0002_insert.postgresql.sql', 'INSERT INTO app_table VALUES (1);')
    expect(await applyDatabaseMigrations(hub('postgresql'), db)).toBe(true)
    expect(await history('public._hub_migrations')).toEqual([{ id: 1, name: '0001_create' }, { id: 2, name: '0002_insert' }])
  })

  it('fails to move when there is no history', async () => {
    await client.exec('CREATE SCHEMA nuxthub')

    await expect(moveDatabaseMigrationsHistory(config('nuxthub'), db)).rejects.toThrow('No migration history found through search_path')
    await expect(moveDatabaseMigrationsHistory(config('nuxthub'), db, { revert: true })).rejects.toThrow('No migration history found in "nuxthub"."_hub_migrations"')
  })
})

describe('getMigrationsTableName', () => {
  it('qualifies the table only for PostgreSQL with migrationsSchema', () => {
    expect(getMigrationsTableName({ dialect: 'postgresql' })).toBe('_hub_migrations')
    expect(getMigrationsTableName({ dialect: 'postgresql', migrationsSchema: 'nuxthub' })).toBe('"nuxthub"."_hub_migrations"')
    expect(getMigrationsTableName({ dialect: 'postgresql', migrationsSchema: 'a"b' })).toBe('"a""b"."_hub_migrations"')
    expect(getMigrationsTableName({ dialect: 'sqlite', migrationsSchema: 'nuxthub' })).toBe('_hub_migrations')
    expect(getMigrationsTableName({ dialect: 'mysql' })).toBe('_hub_migrations')
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
