import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import type { HubConfig } from '../../../../../features'

export function useMigrationsStorage(hub: HubConfig) {
  return createStorage({
    driver: fsDriver({
      base: hub.migrationsPath,
      ignore: ['.DS_Store']
    })
  })
}

export async function getMigrationFiles(hub: HubConfig) {
  const fileKeys = await useMigrationsStorage(hub).getKeys()
  return fileKeys.filter(file => file.endsWith('.sql'))
}

export const CreateMigrationsTableQuery = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const AppliedMigrationsQuery = 'select "id", "name", "applied_at" from "_hub_migrations" order by "_hub_migrations"."id"'

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
        i += 1
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
