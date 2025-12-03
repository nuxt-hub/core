import { readFile } from 'node:fs/promises'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import overlayDriver from 'unstorage/drivers/overlay'
import { join } from 'pathe'
import type { ResolvedHubConfig } from '../../types/module'
import { getMigrationMetadata } from './utils'

// #region Migrations
export function useDatabaseMigrationsStorage(hub: ResolvedHubConfig) {
  // .data/hub/db/migrations
  return createStorage({
    driver: fsDriver({
      base: join(hub.dir, 'db/migrations')
    })
  })
}

export async function getDatabaseMigrationFiles(hub: ResolvedHubConfig) {
  if (!hub.db) return []
  const dialect = hub.db.dialect
  const storage = useDatabaseMigrationsStorage(hub)

  // Get migrations and exclude if dialect specified but not the current database dialect
  const migrationsFiles = (await storage.getKeys()).map(file => getMigrationMetadata(file)).filter(migration => migration.dialect === dialect || !migration.dialect)

  return migrationsFiles.filter((migration) => {
    // if generic SQL migration file, exclude it if same migration name for current database dialect exists
    if (!migration.dialect && migrationsFiles.findIndex(m => m.name === migration.name && m.dialect === dialect) !== -1) {
      return false
    }
    return true
  })
}

export async function copyDatabaseMigrationsToHubDir(hub: ResolvedHubConfig) {
  if (!hub.db) return
  const srcStorage = createStorage({
    driver: overlayDriver({
      layers: hub.db.migrationsDirs.map(dir => fsDriver({
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

// #endregion

// #region Queries
export function useDatabaseQueriesStorage(hub: ResolvedHubConfig) {
  // .data/hub/db/queries
  return createStorage({
    driver: fsDriver({
      base: join(hub.dir, 'db/queries')
    })
  })
}

export async function getDatabaseQueryFiles(hub: ResolvedHubConfig) {
  const storage = useDatabaseQueriesStorage(hub)
  // Get database dialect from hub config
  const dialect = typeof hub.db === 'string'
    ? hub.db
    : (typeof hub.db === 'object' && hub.db !== null && 'dialect' in hub.db)
        ? hub.db.dialect
        : undefined

  const queriesFiles = (await storage.getKeys()).map(file => getMigrationMetadata(file)).filter(query => query.dialect === dialect || !query.dialect)

  return queriesFiles.filter((query) => {
    // if generic SQL query file, exclude it if same query name for current database dialect exists
    if (!query.dialect && queriesFiles.findIndex(q => q.name === query.name && q.dialect === dialect) !== -1) {
      return false
    }
    return true
  })
}

export async function copyDatabaseQueriesToHubDir(hub: ResolvedHubConfig) {
  if (!hub.db) return
  const destStorage = useDatabaseQueriesStorage(hub)
  await destStorage.clear()

  await Promise.all(hub.db.queriesPaths.map(async (path) => {
    try {
      const filename = path.split('/').pop()!
      const sql = await readFile(path, 'utf-8')
      await destStorage.setItem(filename, sql)
    } catch (error: any) {
      console.error(`Failed to read database query file ${path}: ${error.message}`)
    }
  }))
}
