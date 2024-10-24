import { join } from 'pathe'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

export const useMigrationsStorage = () => {
  const cwd = process.cwd()
  const migrationsDir = join(cwd, 'server/database/migrations')
  return createStorage({
    driver: fsDriver({
      base: migrationsDir,
      ignore: ['.DS_Store']
    })
  })
}

export const getMigrationFiles = async () => {
  const fileKeys = await useMigrationsStorage().getKeys()
  return fileKeys.filter(file => file.endsWith('.sql'))
}

export const createMigrationsTableQuery = `CREATE TABLE IF NOT EXISTS hub_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const appliedMigrationsQuery = 'select "id", "name", "applied_at" from "hub_migrations" order by "hub_migrations"."id"'
