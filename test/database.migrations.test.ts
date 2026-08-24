import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import type { ResolvedHubConfig } from '../src/types'
import { applyDatabaseMigrations } from '../src/db/lib/migrations'

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

  function hub() {
    return {
      dir: rootDir,
      db: { dialect: 'postgresql' }
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
})
