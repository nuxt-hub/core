import { join } from 'pathe'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { $fetch } from 'ofetch'
import { useRuntimeConfig, logger } from '@nuxt/kit'
import { hubHooks } from '../runtime/base/server/utils/hooks'

const log = logger.withTag('nuxt:hub')

export const runMigrations = async () => {
  await createMigrationsTable()

  const remoteMigrations = await getRemoteMigrations().catch((error) => {
    log.error(`Could not retrieve migrations on ${process.env.NUXT_HUB_ENV}.`)
    if (error) log.error(error)
  })
  if (!remoteMigrations) process.exit(1)
  if (!remoteMigrations.length) log.warn(`No applied migrations on ${process.env.NUXT_HUB_ENV}.`)

  const localMigrations = (await getMigrationFiles()).map(fileName => fileName.replace('.sql', ''))

  const pendingMigrations = localMigrations.filter(localName => !remoteMigrations.find(({ name }) => name === localName))
  if (!pendingMigrations.length) log.info('No pending migrations to apply.')

  await hubHooks.callHookParallel('migrations:done')
}

export const useDatabaseQuery = async <T>(query: string) => {
  const config = useRuntimeConfig().hub
  return await $fetch<Array<{ results: Array<T>, success: boolean, meta: object }>>(`/api/projects/${process.env.NUXT_HUB_PROJECT_KEY}/database/${process.env.NUXT_HUB_ENV}/query`, {
    baseURL: config.url,
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN}`
    },
    body: { query, mode: 'raw' }
  }).catch((error) => {
    if (error.response?.status === 400) {
      throw `NuxtHub database is not enabled on \`${process.env.NUXT_HUB_ENV}\`. Deploy a new version with \`hub.database\` enabled and try again.`
    }
    throw error
  })
}

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

export const getRemoteMigrations = async () => {
  const query = 'select "id", "name", "applied_at" from "hub_migrations" order by "hub_migrations"."id"'
  return (await useDatabaseQuery<{ id: number, name: string, applied_at: string }>(query).catch((error) => {
    if (error.response?.status === 500 && error.response?._data?.message.includes('no such table')) {
      return []
    }
    throw ''
  }))?.[0]?.results ?? []
}

export const createMigrationsTable = async () => {
  const query = `CREATE TABLE IF NOT EXISTS hub_migrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`
  await useDatabaseQuery(query)
}
