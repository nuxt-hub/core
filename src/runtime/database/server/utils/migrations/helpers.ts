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

export async function getDatabaseMigrationFiles(hub: HubConfig) {
  const fileKeys = await useDatabaseMigrationsStorage(hub).getKeys()
  return fileKeys.filter(file => file.endsWith('.sql'))
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

export const CreateDatabaseMigrationsTableQuery = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const AppliedDatabaseMigrationsQuery = 'select "id", "name", "applied_at" from "_hub_migrations" order by "_hub_migrations"."id"'
// #endregion

// #region Queries
export function useDatabaseQueriesStorage(hub: HubConfig) {
  // .data/hub/database/migrations
  return createStorage({
    driver: fsDriver({
      base: join(hub.dir!, 'database/queries')
    })
  })
}
export async function getDatabaseQueryFiles(hub: HubConfig) {
  const fileKeys = await useDatabaseQueriesStorage(hub).getKeys()
  return fileKeys.filter(file => file.endsWith('.sql'))
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
export function splitSqlQueries(sqlFileContent: string): string[] {
  const queries = []
  // Track whether we're inside a string literal
  let inString = false
  let stringFence = ''
  let result = ''

  // Process the content character by character
  for (let i = 0; i < sqlFileContent.length; i += 1) {
    const char = sqlFileContent[i]
    const nextChar = sqlFileContent[i + 1]

    // Handle string literals
    if ((char === '\'' || char === '"') && sqlFileContent[i - 1] !== '\\') {
      if (!inString) {
        inString = true
        stringFence = char
      } else if (char === stringFence) {
        inString = false
      }
    }

    // Only remove comments when not inside a string
    if (!inString) {
      // `--` comments
      if (char === '-' && nextChar === '-') {
        while (i < sqlFileContent.length && sqlFileContent[i] !== '\n') {
          i += 1
        }
        continue
      }

      // `/* */` comments
      if (char === '/' && nextChar === '*') {
        i += 2
        while (i < sqlFileContent.length && !(sqlFileContent[i] === '*' && sqlFileContent[i + 1] === '/')) {
          i += 1
        }
        i += 2
        continue
      }

      if (char === ';' && sqlFileContent[i - 1] !== '\\') {
        if (result.trim() !== '') {
          result += char
          queries.push(result.trim())
          result = ''
        }
        continue
      }
    }

    result += char
  }
  if (result.trim() !== '') {
    queries.push(result.trim())
  }

  // Process each query
  return queries
    .map((query) => {
      if (!query.endsWith(';')) {
        query += ';'
      }
      return query.replace(/;+$/, ';')
    })
}
// #endregion
