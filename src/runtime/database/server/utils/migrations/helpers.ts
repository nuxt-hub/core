import { readFile } from 'node:fs/promises'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import overlayDriver from 'unstorage/drivers/overlay'
import { join } from 'pathe'
import type { HubConfig } from '../../../../../features'

// #region Migrations
export function useDatabaseMigrationsStorage(hub: HubConfig) {
  // .data/hub/database/migrations
  return createStorage({
    driver: fsDriver({
      base: join(hub.dir!, 'database/migrations')
    })
  })
}

/**
 * Extract the base migration name and dialtect from a filename
 * e.g., '0001_create-todos.postgresql.sql' -> '0001_create-todos'
 * e.g., '0001_create-todos.sql' -> '0001_create-todos'
 */
export function getMigrationMetadata(filename: string): { filename: string, name: string, dialect: string | undefined } {
  // Remove .sql extension
  let name = filename.replace(/\.sql$/, '')
  // Remove dialect suffix if present (e.g., .postgresql, .sqlite, .mysql)
  const dialect = name.match(/\.(postgresql|sqlite|mysql)$/)?.[1]
  if (dialect) {
    name = name.replace(`.${dialect}`, '')
  }
  return {
    filename,
    name,
    dialect
  }
}

export async function getDatabaseMigrationFiles(hub: HubConfig) {
  const storage = useDatabaseMigrationsStorage(hub)
  // Get database dialect from hub config
  const dialect = typeof hub.database === 'string'
    ? hub.database
    : (typeof hub.database === 'object' && hub.database !== null && 'dialect' in hub.database)
      ? hub.database.dialect
      : undefined

  // Get migrations and exclude if dialect specified but not the current database dialect
  const migrationsFiles = (await storage.getKeys()).map(file => getMigrationMetadata(file)).filter(migration => migration.dialect === dialect || !migration.dialect)

  return migrationsFiles.filter(migration => {
    // if generic SQL migration file, exclude it if same migration name for current database dialect exists
    if (!migration.dialect && migrationsFiles.findIndex(m => m.name === migration.name && m.dialect === dialect) !== -1) {
      return false
    }
    return true
  })
}

export async function copyDatabaseMigrationsToHubDir(hub: HubConfig) {
  const srcStorage = createStorage({
    driver: overlayDriver({
      layers: hub.databaseMigrationsDirs!.map(dir => fsDriver({
        base: dir,
        ignore: ['.DS_Store']
      }))
    })
  })
  const destStorage = useDatabaseMigrationsStorage(hub)
  await destStorage.clear()
  const migrationFiles = (await srcStorage.getKeys()).filter(file => file.endsWith('.sql'))
  await Promise.all(migrationFiles.map(async (file) => {
    const sql = await srcStorage.getItem(file)
    await destStorage.setItem(file, sql)
  }))
}

export const CreateDatabaseMigrationsTableQuerySqlite = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const CreateDatabaseMigrationsTableQueryPostgresql = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const CreateDatabaseMigrationsTableQueryMysql = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const CreateDatabaseMigrationsTableQueryLibsql = CreateDatabaseMigrationsTableQuerySqlite

export const AppliedDatabaseMigrationsQuery = 'select "id", "name", "applied_at" from "_hub_migrations" order by "_hub_migrations"."id"'

/**
 * Get the appropriate create table query for the migrations table based on the database dialect
 */
export function getCreateMigrationsTableQuery(db: { dialect: string }): string {
  const dialect = db.dialect

  switch (dialect) {
    case 'postgresql':
      return CreateDatabaseMigrationsTableQueryPostgresql
    case 'mysql':
      return CreateDatabaseMigrationsTableQueryMysql
    case 'sqlite':
      return CreateDatabaseMigrationsTableQuerySqlite
    case 'libsql':
      return CreateDatabaseMigrationsTableQueryLibsql
    default:
      throw new Error('Invalid database dialect')
  }
}
// #endregion

// #region Queries
export function useDatabaseQueriesStorage(hub: HubConfig) {
  // .data/hub/database/queries
  return createStorage({
    driver: fsDriver({
      base: join(hub.dir!, 'database/queries')
    })
  })
}

export async function getDatabaseQueryFiles(hub: HubConfig) {
  const storage = useDatabaseQueriesStorage(hub)
  // Get database dialect from hub config
  const dialect = typeof hub.database === 'string'
    ? hub.database
    : (typeof hub.database === 'object' && hub.database !== null && 'dialect' in hub.database)
      ? hub.database.dialect
      : undefined

  const queriesFiles = (await storage.getKeys()).map(file => getMigrationMetadata(file)).filter(query => query.dialect === dialect || !query.dialect)

  return queriesFiles.filter(query => {
    // if generic SQL query file, exclude it if same query name for current database dialect exists
    if (!query.dialect && queriesFiles.findIndex(q => q.name === query.name && q.dialect === dialect) !== -1) {
      return false
    }
    return true
  })
}

export async function copyDatabaseQueriesToHubDir(hub: HubConfig) {
  const destStorage = useDatabaseQueriesStorage(hub)
  await destStorage.clear()

  await Promise.all(hub.databaseQueriesPaths!.map(async (path) => {
    try {
      const filename = path.split('/').pop()!
      const sql = await readFile(path, 'utf-8')
      await destStorage.setItem(filename, sql)
    } catch (error: any) {
      console.error(`Failed to read database query file ${path}: ${error.message}`)
    }
  }))
}
// #endregion

// #region Utils
/**
 * Split a string containing SQL queries into an array of individual queries after removing comments
 */
export function splitSqlQueries(sqlFileContent: string): string[] {
  const queries: string[] = []
  let inString = false
  let stringFence = ''
  let result = ''

  let currentGeneralWord = ''
  let previousGeneralWord = ''
  let inTrigger = false

  let currentTriggerWord = ''
  let triggerBlockNestingLevel = 0

  for (let i = 0; i < sqlFileContent.length; i += 1) {
    const char = sqlFileContent[i]
    const nextChar = sqlFileContent[i + 1]

    // Skip if char is undefined (shouldn't happen but satisfies TypeScript)
    if (!char) continue

    // Handle string literals
    if ((char === '\'' || char === '"') && (i === 0 || sqlFileContent[i - 1] !== '\\')) {
      if (!inString) {
        inString = true
        stringFence = char
      } else if (char === stringFence) {
        inString = false
      }
    }

    // Only remove comments when not inside a string
    if (!inString) {
      // Handle -- comments
      if (char === '-' && nextChar === '-') {
        while (i < sqlFileContent.length && sqlFileContent[i] !== '\n') {
          i += 1
        }
        continue
      }

      // Handle /* */ comments
      if (char === '/' && nextChar === '*') {
        i += 2
        while (i < sqlFileContent.length && !(sqlFileContent[i] === '*' && sqlFileContent[i + 1] === '/')) {
          i += 1
        }
        i += 2
        continue
      }

      // Track general keywords for CREATE TRIGGER detection
      if (/\w/.test(char)) {
        currentGeneralWord += char.toLowerCase()
      } else {
        // Check if previous word was 'create' and current is 'trigger'
        if (previousGeneralWord === 'create' && currentGeneralWord === 'trigger') {
          inTrigger = true
        }
        previousGeneralWord = currentGeneralWord
        currentGeneralWord = ''
      }

      // If in trigger, track BEGIN/END
      if (inTrigger) {
        if (/\w/.test(char)) {
          currentTriggerWord += char.toLowerCase()
        } else {
          if (currentTriggerWord === 'begin') {
            triggerBlockNestingLevel++
          } else if (currentTriggerWord === 'end') {
            triggerBlockNestingLevel = Math.max(triggerBlockNestingLevel - 1, 0)
          }
          currentTriggerWord = ''
        }
      }

      // Handle semicolon
      if (char === ';' && sqlFileContent[i - 1] !== '\\') {
        if (inTrigger) {
          if (triggerBlockNestingLevel === 0) {
            // End of trigger, split here
            result += char
            const trimmedResult = result.trim()
            if (trimmedResult !== '') {
              queries.push(trimmedResult)
            }
            result = ''
            inTrigger = false
            triggerBlockNestingLevel = 0
            continue
          } else {
            // Inside trigger, do not split
            result += char
          }
        } else {
          // Not in trigger, split as usual
          result += char
          const trimmedResult = result.trim()
          if (trimmedResult !== '') {
            queries.push(trimmedResult)
          }
          result = ''
          continue
        }
      }
    }

    result += char
  }

  // Add any remaining content as a query
  const finalTrimmed = result.trim()
  if (finalTrimmed !== '') {
    queries.push(finalTrimmed)
  }

  // Process each query to ensure it ends with a single semicolon and filter out empty/semicolon-only
  return queries
    .map((query) => {
      // Handle semicolons in trigger bodies
      if (query.includes('TRIGGER') && query.includes('BEGIN')) {
        // First, handle the statements inside the trigger
        query = query.replace(/;+(?=\s+(?:END|\S|$))/g, ';')
      }
      return query.replace(/;+$/, ';')
    })
    .filter(query => query !== ';' && query.trim() !== '')
}
// #endregion
