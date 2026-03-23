import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'pathe'
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

function resolveWithExtensions(path) {
  if (existsSync(path)) return path
  for (const ext of ['.mjs', '.js', '.ts', '.mts', '.json']) {
    if (existsSync(path + ext)) return path + ext
  }
  return path
}

export async function getTsconfigAliases(cwd) {
  try {
    const tsconfig = JSON.parse(await readFile(join(cwd, '.nuxt/tsconfig.json'), 'utf-8'))
    const paths = tsconfig.compilerOptions?.paths || {}
    const alias = {}
    for (const [key, values] of Object.entries(paths)) {
      const resolvedPath = key.endsWith('/*') ? values[0].replace(/\/\*$/, '') : values[0]
      alias[key.replace(/\/\*$/, '')] = resolveWithExtensions(resolve(join(cwd, '.nuxt'), resolvedPath))
    }
    return alias
  } catch {
    return {}
  }
}
