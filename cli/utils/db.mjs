import { join } from 'pathe'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

let _storage
export function useMigrationsStorage() {
  if (!_storage) {
    const cwd = process.cwd()
    const migrationsDir = join(cwd, 'server/db/migrations')
    _storage = createStorage({
      driver: fsDriver({
        base: migrationsDir,
        ignore: ['.DS_Store']
      })
    })
  }
  return _storage
}

export async function getMigrationFiles() {
  const fileKeys = await useMigrationsStorage().getKeys()
  return fileKeys.filter(file => file.endsWith('.sql'))
}

export async function getNextMigrationNumber() {
  const files = await getMigrationFiles()
  const lastSequentialMigrationNumber = files
    .map(file => file.split('_')[0])
    .map(num => Number.parseInt(num, 10))
    .sort((a, b) => a - b)
    .pop() ?? 0

  return (lastSequentialMigrationNumber + 1).toString().padStart(4, '0')
}
