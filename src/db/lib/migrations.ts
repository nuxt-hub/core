import { consola } from 'consola'
import { join, relative } from 'pathe'
import type { ResolvedHubConfig } from '@nuxthub/core'
import { AppliedDatabaseMigrationsQuery, NoTransactionMigrationDirective, PostgresqlMigrationsLockedMessage, dollarQuote, getAtomicPostgresqlMigrationQuery, getCreateMigrationsTableQuery, getRecordPostgresqlMigrationQuery, isNoTransactionMigration, splitSqlQueries } from './utils'
import { useDatabaseMigrationsStorage, getDatabaseMigrationFiles, useDatabaseQueriesStorage, getDatabaseQueryFiles } from './storage'

function getRelativePath(fullPath: string) {
  return relative(process.cwd(), fullPath)
}

type PostgresqlSession = {
  query: (text: string) => Promise<any[]>
  release: () => Promise<void>
}

async function reservePostgresqlSession(client: any): Promise<PostgresqlSession | undefined> {
  // postgres-js
  if (typeof client?.reserve === 'function') {
    const reserved = await client.reserve()
    return { query: async text => [...await reserved.unsafe(text)], release: async () => reserved.release() }
  }
  // node-postgres Pool
  if (typeof client?.connect === 'function' && 'totalCount' in client) {
    const connection = await client.connect()
    return { query: async text => (await connection.query(text)).rows, release: async () => connection.release() }
  }
  // node-postgres Client and PGlite hold a single connection
  if (typeof client?.query === 'function') {
    return { query: async text => (await client.query(text)).rows, release: async () => {} }
  }
}

// Lock attempts never wait inside a statement: a waiting statement holds a snapshot that `CREATE INDEX CONCURRENTLY` waits for
async function retryWhileLocked<T>(attempt: () => Promise<T>, log: ReturnType<typeof consola.withTag>): Promise<T> {
  let waiting = false
  while (true) {
    try {
      return await attempt()
    } catch (error: any) {
      if (!(error.cause?.message || error.message)?.includes(PostgresqlMigrationsLockedMessage)) throw error
    }
    if (!waiting) log.info('Waiting for another instance to finish database migrations...')
    waiting = true
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

async function acquirePostgresqlMigrationsLock(session: PostgresqlSession, log: ReturnType<typeof consola.withTag>) {
  await retryWhileLocked(async () => {
    const [row] = await session.query(`SELECT pg_try_advisory_lock(hashtext('nuxthub'), hashtext('migrations')) AS locked`)
    if (!row?.locked) throw new Error(PostgresqlMigrationsLockedMessage)
  }, log)
}

export async function applyDatabaseMigrations(hub: ResolvedHubConfig, db: any) {
  if (!hub.db) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')

  const migrationsStorage = useDatabaseMigrationsStorage(hub)
  const dialect = hub.db.dialect
  const execute = dialect === 'sqlite' ? 'run' : 'execute'
  const getRows = (result: any) => (dialect === 'mysql' ? result[0] : result.results || result.rows || result) || []

  const createMigrationsTableQuery = getCreateMigrationsTableQuery({ dialect: hub.db.dialect })
  log.debug('Creating migrations table if not exists...')
  const drizzleOrmPkg = 'drizzle-orm'
  const sql = await import(drizzleOrmPkg).then(m => m.sql)
  try {
    await retryWhileLocked(() => db[execute](sql.raw(createMigrationsTableQuery)), log)
  } catch (error: any) {
    const message = error.cause?.message || error.message
    log.error(`Failed to create migrations table\n${message}`)
    return false
  }
  log.debug('Successfully created migrations table if not exists')

  let appliedRows = []
  try {
    appliedRows = getRows(await db[execute](sql.raw(AppliedDatabaseMigrationsQuery)))
  } catch (error: any) {
    const message = error.cause?.message || error.message
    log.error(`Failed to fetch applied migrations\n${message}`)
    return false
  }
  if (!import.meta.dev) {
    log.info(`Found ${appliedRows.length} applied migration${appliedRows.length === 1 ? '' : 's'}`)
  }

  const localMigrations = await getDatabaseMigrationFiles(hub)
  const pendingMigrations = localMigrations.filter(migration => !appliedRows.find((row: any) => {
    const name = row.name || row[1] // Handle both object and array responses
    return name === migration.name
  }))
  if (!pendingMigrations.length) {
    !import.meta.dev && log.success('Database migrations up to date')
    return
  }

  const migrations = []
  for (const migration of pendingMigrations) {
    const query = await migrationsStorage.getItem<string>(migration.filename)
    if (query) migrations.push({ ...migration, query })
  }

  let session: PostgresqlSession | undefined
  if (dialect === 'postgresql' && migrations.some(migration => isNoTransactionMigration(migration.query))) {
    session = hub.db.driver === 'neon-http' ? undefined : await reservePostgresqlSession(db.$client)
    if (!session) {
      log.error(`Migrations starting with \`${NoTransactionMigrationDirective}\` need a driver with session connections, such as \`postgres-js\`, \`node-postgres\` or \`pglite\`.`)
      return false
    }
    await acquirePostgresqlMigrationsLock(session, log)
  }

  try {
    for (const migration of migrations) {
      const migrationPath = getRelativePath(join(hub.dir!, 'db/migrations', migration.filename))
      try {
        log.debug(`Applying database migration \`${migrationPath}\`...`)
        if (dialect !== 'postgresql') {
          for (const query of splitSqlQueries(migration.query)) {
            await db[execute](sql.raw(query))
          }
          await db[execute](sql`INSERT INTO _hub_migrations (name) VALUES (${migration.name})`)
        } else if (!session) {
          await retryWhileLocked(() => db[execute](sql.raw(getAtomicPostgresqlMigrationQuery(migration.name, migration.query))), log)
        } else if (!isNoTransactionMigration(migration.query)) {
          await session.query(getAtomicPostgresqlMigrationQuery(migration.name, migration.query))
        } else {
          const applied = await session.query(`SELECT 1 FROM _hub_migrations WHERE name = ${dollarQuote(migration.name)}`)
          if (applied.length) continue
          for (const query of splitSqlQueries(migration.query)) {
            await session.query(query)
          }
          await session.query(getRecordPostgresqlMigrationQuery(migration.name))
        }
      } catch (error: any) {
        const message = error.cause?.message || error.message
        log.error(`Failed to apply migration \`${migrationPath}\`\n${message}`)
        if (message?.includes('already exists')) {
          log.info(`To mark this migration as applied, run \`npx nuxt db mark-as-migrated ${migration.name}\``)
          log.info('To drop a table, run `npx nuxt db drop <table-name>`')
        }
        if (dialect === 'postgresql' && /cannot be executed from a function|cannot run inside a transaction block|unsafe use of new value|transaction commands/.test(message || '')) {
          log.info(`PostgreSQL migrations run in a transaction. Split the file so a new enum value is used in a later migration, or move the statement to a migration that starts with \`${NoTransactionMigrationDirective}\`.`)
        }
        return false
      }

      log.success(`Database migration \`${migrationPath}\` applied`)
    }
  } finally {
    if (session) {
      await session.query(`SELECT pg_advisory_unlock(hashtext('nuxthub'), hashtext('migrations'))`).catch(() => {})
      await session.release()
    }
  }
  !import.meta.dev && log.success('Database migrations applied successfully.')
  return true
}

export async function applyDatabaseQueries(hub: ResolvedHubConfig, db: any) {
  if (!hub.db) return
  // Create a logger for this function (at runtime so we can have the debug level when run by the CLI)
  const log = consola.withTag('nuxt:hub')
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const queriesFiles = await getDatabaseQueryFiles(hub)
  if (!queriesFiles.length) return
  const execute = hub.db.dialect === 'sqlite' ? 'run' : 'execute'

  for (const queryFile of queriesFiles) {
    const sqlQuery = await queriesStorage.getItem<string>(queryFile.filename)
    if (!sqlQuery) continue
    const queries = splitSqlQueries(sqlQuery)
    const drizzleOrmPkg = 'drizzle-orm'
    const sql = await import(drizzleOrmPkg).then(m => m.sql)
    try {
      log.debug(`Applying database query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\`...`)
      for (const query of queries) {
        await db[execute](sql.raw(query))
      }
    } catch (error: any) {
      const message = error.cause?.message || error.message
      log.error(`Failed to apply query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\`\n${message}`)
      return false
    }

    !import.meta.dev && log.success(`Database query \`${getRelativePath(join(hub.dir!, 'db/queries', queryFile.filename))}\` applied`)
  }
  !import.meta.dev && log.success('Database queries applied successfully.')
  return true
}
