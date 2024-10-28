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
  // Remove all inline comments (-- ...)
  let content = sqlFileContent.replace(/--.*$/gm, '')

  // Remove all multi-line comments (/* ... */)
  content = content.replace(/\/\*[\s\S]*?\*\//g, '')

  // Split by semicolons but keep them in the result
  const rawQueries = content.split(/(?<=;)/)

  // Process each query
  return rawQueries
    .map(query => query.trim()) // Remove whitespace
    .filter((query) => {
      // Remove empty queries and standalone semicolons
      return query !== '' && query !== ';'
    })
    .map((query) => {
      // Ensure each query ends with exactly one semicolon
      if (!query.endsWith(';')) {
        query += ';'
      }
      // Remove multiple semicolons at the end
      return query.replace(/;+$/, ';')
    })
}
