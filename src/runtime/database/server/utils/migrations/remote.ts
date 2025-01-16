import log from 'consola'
import { $fetch } from 'ofetch'
import type { HubConfig } from '../../../../../features'
import { AppliedMigrationsQuery, CreateMigrationsTableQuery, getMigrationFiles, useMigrationsStorage } from './helpers'

export async function applyRemoteMigrations(hub: HubConfig) {
  const srcStorage = useMigrationsStorage(hub)
  let appliedMigrations = []
  try {
    appliedMigrations = await fetchRemoteMigrations(hub)
  } catch (error: any) {
    log.error(`Could not fetch applied migrations: ${error.response?._data?.message}`)
    return false
  }
  const localMigrations = (await getMigrationFiles(hub)).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !appliedMigrations.find(({ name }) => name === localName))

  if (!pendingMigrations.length) {
    log.success('Database migrations up to date')
    return true
  }

  for (const migration of pendingMigrations) {
    let query = await srcStorage.getItem<string>(`${migration}.sql`)
    if (!query) continue
    if (query.replace(/\s$/, '').at(-1) !== ';') query += ';' // ensure previous statement ended before running next query
    query += `
      ${CreateMigrationsTableQuery}
      INSERT INTO _hub_migrations (name) values ('${migration}');
    `

    try {
      await queryRemoteDatabase(hub, query)
    } catch (error: any) {
      log.error(`Failed to apply migration \`${migration}.sql\`: ${error.response?._data?.message}`)
      if (error.response?._data?.message?.includes('already exists')) {
        log.info(`To mark all migrations as already applied, run: \`npx nuxthub database migrations mark-all-applied --${hub.env}\``)
      }
      return false
    }

    log.success(`Database migration \`${migration}.sql\` applied`)
    log.success('Database migrations up to date')
    return true
  }
}

export async function queryRemoteDatabase<T>(hub: HubConfig, query: string) {
  return await $fetch<Array<{ results: Array<T>, success: boolean, meta: object }>>(`/api/projects/${hub.projectKey}/database/${hub.env}/query`, {
    baseURL: hub.url,
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN || hub.userToken}`
    },
    body: { query }
  })
}

export async function createRemoteMigrationsTable(hub: HubConfig) {
  await queryRemoteDatabase(hub, CreateMigrationsTableQuery)
}

export async function fetchRemoteMigrations(hub: HubConfig) {
  const res = await queryRemoteDatabase<{ id: number, name: string, applied_at: string }>(hub, AppliedMigrationsQuery).catch((error) => {
    if (error.response?._data?.message.includes('no such table')) {
      return []
    }
    throw error
  })
  return res[0]?.results ?? []
}
