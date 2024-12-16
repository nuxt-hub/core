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
  const result = removeSqlComments(sqlFileContent)

  // Split by semicolons but keep them in the result
  const rawQueries = result.split(/(?<=;)/)

  // Process each query
  return rawQueries
    .map(query => query.trim())
    .filter(query => query !== '' && query !== ';')
    .map((query) => {
      if (!query.endsWith(';')) {
        query += ';'
      }
      return query.replace(/;+$/, ';')
    })
}

export function removeSqlComments(content: string) {
  // Track whether we're inside a string literal
  let inString = false
  let stringFence = ''
  let result = ''

  // Process the content character by character
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    // Handle string literals
    if ((char === '\'' || char === '"') && content[i - 1] !== '\\') {
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
        while (i < content.length && content[i] !== '\n') {
          i++
        }
        continue
      }

      // `/* */` comments
      if (char === '/' && nextChar === '*') {
        i += 2
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
          i++
        }
        i += 2
        continue
      }
    }

    result += char
  }

  return result
}
