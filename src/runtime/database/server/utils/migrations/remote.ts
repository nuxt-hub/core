import log from 'consola'
import { $fetch } from 'ofetch'
import type { HubConfig } from '../../../../../features'
import { AppliedDatabaseMigrationsQuery, CreateDatabaseMigrationsTableQuery, getDatabaseMigrationFiles, getDatabaseQueryFiles, useDatabaseMigrationsStorage, useDatabaseQueriesStorage } from './helpers'

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

// #region Remote migrations

export async function fetchRemoteDatabaseMigrations(hub: HubConfig) {
  const res = await queryRemoteDatabase<{ id: number, name: string, applied_at: string }>(hub, AppliedDatabaseMigrationsQuery).catch((error) => {
    if (error.response?._data?.message.includes('no such table')) {
      return []
    }
    throw error
  })
  return res[0]?.results ?? []
}

export async function applyRemoteDatabaseMigrations(hub: HubConfig) {
  const migrationsStorage = useDatabaseMigrationsStorage(hub)
  let appliedMigrations = []
  try {
    appliedMigrations = await fetchRemoteDatabaseMigrations(hub)
  } catch (error: any) {
    log.error(`Could not fetch applied migrations: ${error.response?._data?.message}`)
    return false
  }
  const localMigrations = (await getDatabaseMigrationFiles(hub)).map(fileName => fileName.replace('.sql', ''))
  const pendingMigrations = localMigrations.filter(localName => !appliedMigrations.find(({ name }) => name === localName))

  if (!pendingMigrations.length) {
    log.success('Database migrations up to date')
    return true
  }

  for (const migration of pendingMigrations) {
    let query = await migrationsStorage.getItem<string>(`${migration}.sql`)
    if (!query) continue
    if (query.replace(/\s$/, '').at(-1) !== ';') query += ';' // ensure previous statement ended before running next query
    query += `
      ${CreateDatabaseMigrationsTableQuery}
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
  }
  log.success('Database migrations up to date')
  return true
}

// #endregion
// #region Remote Queries

export async function applyRemoteDatabaseQueries(hub: HubConfig) {
  const queriesStorage = useDatabaseQueriesStorage(hub)
  const queriesPaths = await getDatabaseQueryFiles(hub)
  if (!queriesPaths.length) {
    return true
  }

  for (const queryPath of queriesPaths) {
    let query = await queriesStorage.getItem<string>(queryPath)
    if (!query) continue
    if (query.replace(/\s$/, '').at(-1) !== ';') query += ';' // ensure previous statement ended before running next query

    try {
      await queryRemoteDatabase(hub, query)
    } catch (error: any) {
      log.error(`Failed to apply query \`${queryPath}\`: ${error.response?._data?.message}`)
      return false
    }

    log.success(`Database query \`${queryPath}\` applied`)
    return true
  }
}

// #endregion
