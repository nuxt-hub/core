import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDrizzleClient } from '../src/db/lib/client'
import type { ResolvedDatabaseConfig } from '../src/types'

const { nodePostgresDrizzle } = vi.hoisted(() => ({
  nodePostgresDrizzle: vi.fn(() => ({ driver: 'node-postgres' }))
}))

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: nodePostgresDrizzle
}))

describe('createDrizzleClient', () => {
  beforeEach(() => {
    nodePostgresDrizzle.mockClear()
  })

  it('should create node-postgres clients with drizzle-orm/node-postgres', async () => {
    const config: ResolvedDatabaseConfig = {
      dialect: 'postgresql',
      driver: 'node-postgres',
      connection: {
        connectionString: 'postgresql://user:pass@localhost:5432/db',
        ssl: true
      },
      migrationsDirs: [],
      queriesPaths: [],
      applyMigrationsDuringBuild: true,
      applyMigrationsDuringDev: true,
      casing: 'snake_case'
    }

    const client = await createDrizzleClient(config, '/tmp/hub')

    expect(client).toEqual({ driver: 'node-postgres' })
    expect(nodePostgresDrizzle).toHaveBeenCalledWith({
      connection: {
        connectionString: 'postgresql://user:pass@localhost:5432/db',
        ssl: true
      },
      casing: 'snake_case'
    })
  })

  it('should map connection url to node-postgres connectionString', async () => {
    const config: ResolvedDatabaseConfig = {
      dialect: 'postgresql',
      driver: 'node-postgres',
      connection: {
        url: 'postgresql://user:pass@localhost:5432/db',
        ssl: true
      },
      migrationsDirs: [],
      queriesPaths: [],
      applyMigrationsDuringBuild: true,
      applyMigrationsDuringDev: true
    }

    await createDrizzleClient(config, '/tmp/hub')

    expect(nodePostgresDrizzle).toHaveBeenCalledWith({
      connection: {
        connectionString: 'postgresql://user:pass@localhost:5432/db',
        ssl: true
      }
    })
  })
})
