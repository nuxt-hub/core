import { $fetch } from 'ofetch'
import { useRuntimeConfig, logger } from '@nuxt/kit'
import { appliedMigrationsQuery, createMigrationsTableQuery, useMigrationsStorage } from './helpers'

const log = logger.withTag('nuxt:hub')

export const applyRemoteMigrations = async () => {
  const srcStorage = useMigrationsStorage()
  const hub = useRuntimeConfig().hub

  await createRemoteMigrationsTable()

  log.info('Checking for pending migrations')
  const appliedMigrations = await getRemoteAppliedMigrations().catch((error) => {
    log.error(`Could not retrieve migrations on \`${hub.env}\``)
    if (error) log.error(error)
  })
  if (!appliedMigrations) process.exit(1)
  if (!appliedMigrations.length) log.warn(`No applied migrations on \`${hub.env}\``)

  const localMigrations = (await getMigrationFiles()).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !appliedMigrations.find(({ name }) => name === localName))
  if (!pendingMigrations.length) return log.info('No pending migrations to apply')

  log.info('Applying migrations...')
  for (const migration of pendingMigrations) {
    const migrationFile = await srcStorage.getItemRaw(`${migration}.sql`)
    let query = migrationFile.toString()

    if (query.at(-1) !== ';') query += ';' // ensure previous statement ended before running next query
    query += `
      INSERT INTO hub_migrations (name) values ('${migration}');
    `

    try {
      await useRemoteDatabaseQuery(query)
    } catch (error: any) {
      log.error(`Failed to apply migration \`${migration}\``)
      if (error && error.response) log.error(error.response?._data?.message || error)
      break
    }

    log.success(`Applied migration \`${migration}\`.`)
  }
}

export const useRemoteDatabaseQuery = async <T>(query: string) => {
  const hub = useRuntimeConfig().hub
  return await $fetch<Array<{ results: Array<T>, success: boolean, meta: object }>>(`/api/projects/${hub.projectKey}/database/${hub.env}/query`, {
    baseURL: hub.url,
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN} || ${hub.userToken}`
    },
    body: { query, mode: 'raw' }
  }).catch((error) => {
    if (error.response?.status === 400) {
      throw `NuxtHub database is not enabled on \`${hub.env}\`. Deploy a new version with \`hub.database\` enabled and try again.`
    }
    throw error
  })
}

export const getMigrationFiles = async () => {
  const fileKeys = await useMigrationsStorage().getKeys()
  return fileKeys.filter(file => file.endsWith('.sql'))
}

export const createRemoteMigrationsTable = async () => {
  await useRemoteDatabaseQuery(createMigrationsTableQuery)
}

export const getRemoteAppliedMigrations = async () => {
  return (await useRemoteDatabaseQuery<{ id: number, name: string, applied_at: string }>(appliedMigrationsQuery).catch((error) => {
    if (error.response?.status === 500 && error.response?._data?.message.includes('no such table')) {
      return []
    }
    throw ''
  }))?.[0]?.results ?? []
}
