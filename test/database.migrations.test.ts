import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import type { ResolvedHubConfig } from '../src/types'
import { applyDatabaseMigrations } from '../src/db/lib/migrations'
import { getCreateMigrationsTableQuery } from '../src/db/lib/utils'

describe('PostgreSQL migrations', () => {
  let rootDir: string
  let client: PGlite
  let db: ReturnType<typeof drizzle>
  let executedQueries: string[]

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-postgresql-migrations-'))
    await mkdir(join(rootDir, 'db/migrations'), { recursive: true })
    client = new PGlite()
    executedQueries = []
    db = drizzle(client, {
      logger: {
        logQuery(query) {
          executedQueries.push(query)
        }
      }
    })
  })

  afterEach(async () => {
    await client.close()
    await rm(rootDir, { recursive: true, force: true })
  })

  function hub(migrationsSchema?: string) {
    return {
      dir: rootDir,
      db: { dialect: 'postgresql', migrationsSchema }
    } as ResolvedHubConfig
  }

  it('rolls back failed migration statements and tracking', async () => {
    await writeFile(join(rootDir, 'db/migrations/0001_failure.postgresql.sql'), `
      CREATE TABLE partially_applied (id integer);
      ALTER TABLE missing_table ADD COLUMN value integer;
    `)

    expect(await applyDatabaseMigrations(hub(), db)).toBe(false)

    const result = await client.query(`
      SELECT
        to_regclass('partially_applied') IS NOT NULL AS ddl_applied,
        (SELECT count(*) FROM _hub_migrations) AS tracker_rows
    `)
    expect(result.rows).toEqual([{ ddl_applied: false, tracker_rows: 0 }])
  })

  it('serializes overlapping migration attempts and records once', async () => {
    await writeFile(join(rootDir, 'db/migrations/0001_once.postgresql.sql'), `
      CREATE FUNCTION migration_value() RETURNS text AS $$
      BEGIN
        RETURN '$nuxthub$';
      END;
      $$ LANGUAGE plpgsql;
      CREATE TABLE applied_once (value text DEFAULT '$nuxthub$');
    `)

    expect(await Promise.all([
      applyDatabaseMigrations(hub(), db),
      applyDatabaseMigrations(hub(), db)
    ])).toEqual([true, true])

    const atomicQueries = executedQueries.filter(query => query.startsWith('DO '))
    expect(atomicQueries).toHaveLength(4)
    expect(atomicQueries.every((query) => {
      const lock = query.indexOf('pg_advisory_xact_lock')
      const guardedOperation = Math.max(query.indexOf('CREATE TABLE IF NOT EXISTS'), query.indexOf('IF NOT EXISTS (SELECT'))
      return lock !== -1 && lock < guardedOperation
    })).toBe(true)

    const result = await client.query(`
      SELECT
        to_regclass('applied_once') IS NOT NULL AS ddl_applied,
        migration_value() AS function_value,
        (SELECT count(*) FROM _hub_migrations) AS tracker_rows
    `)
    expect(result.rows).toEqual([{ ddl_applied: true, function_value: '$nuxthub$', tracker_rows: 1 }])
  })

  it('creates and reuses history alongside application tables in the configured schema', async () => {
    await writeFile(join(rootDir, 'db/migrations/0001_auth.postgresql.sql'), `
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE auth.sessions (token text PRIMARY KEY);
      INSERT INTO auth.sessions VALUES ('keep-me');
    `)

    expect(await applyDatabaseMigrations(hub('auth'), db)).toBe(true)
    expect(await applyDatabaseMigrations(hub('auth'), db)).toBeUndefined()
    expect((await client.query(`
      SELECT to_regclass('public._hub_migrations') AS public_history,
        (SELECT count(*) FROM auth._hub_migrations) AS tracker_rows,
        (SELECT token FROM auth.sessions) AS session
    `)).rows).toEqual([{ public_history: null, tracker_rows: 1, session: 'keep-me' }])
  })

  it('moves public history before detecting pending migrations, preserving rows and sequence', async () => {
    await writeFile(join(rootDir, 'db/migrations/0001_auth.postgresql.sql'), `
      CREATE SCHEMA auth;
      CREATE TABLE auth.sessions (token text PRIMARY KEY);
      INSERT INTO auth.sessions VALUES ('keep-me');
    `)
    expect(await applyDatabaseMigrations(hub(), db)).toBe(true)
    const before = await client.query('SELECT * FROM public._hub_migrations')

    expect(await applyDatabaseMigrations(hub('auth'), db)).toBeUndefined()
    expect((await client.query('SELECT * FROM auth._hub_migrations')).rows).toEqual(before.rows)
    expect((await client.query('SELECT * FROM auth.sessions')).rows).toEqual([{ token: 'keep-me' }])
    expect((await client.query('SELECT to_regclass(\'public._hub_migrations\') AS old_history')).rows).toEqual([{ old_history: null }])
    expect((await client.query('INSERT INTO auth._hub_migrations (name) VALUES (\'next\') RETURNING id')).rows).toEqual([{ id: 2 }])
  })

  it('leaves conflicting histories untouched', async () => {
    await client.exec(getCreateMigrationsTableQuery({ dialect: 'postgresql' }))
    await client.exec(`
      CREATE SCHEMA auth;
      CREATE TABLE auth._hub_migrations (LIKE public._hub_migrations INCLUDING ALL);
      INSERT INTO public._hub_migrations (name) VALUES ('public-history');
      INSERT INTO auth._hub_migrations (name) VALUES ('auth-history');
    `)
    expect(await applyDatabaseMigrations(hub('auth'), db)).toBe(false)
    expect((await client.query('SELECT name FROM public._hub_migrations')).rows).toEqual([{ name: 'public-history' }])
    expect((await client.query('SELECT name FROM auth._hub_migrations')).rows).toEqual([{ name: 'auth-history' }])
  })

  it('quotes custom schema names in creation, lookup, relocation and inserts', async () => {
    const schema = `auth"quoted'. $nuxthub$ $&`
    await writeFile(join(rootDir, 'db/migrations/0001_first.postgresql.sql'), 'CREATE TABLE first_table (id integer);')
    expect(await applyDatabaseMigrations(hub(), db)).toBe(true)
    await writeFile(join(rootDir, 'db/migrations/0002_second.postgresql.sql'), 'CREATE TABLE second_table (id integer);')
    expect(await applyDatabaseMigrations(hub(schema), db)).toBe(true)
    expect(await applyDatabaseMigrations(hub(schema), db)).toBeUndefined()
    const table = `"${schema.replace(/"/g, '""')}"._hub_migrations`
    expect((await client.query(`SELECT count(*) FROM ${table}`)).rows).toEqual([{ count: 2 }])
  })
})
