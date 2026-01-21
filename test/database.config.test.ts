import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { resolveDatabaseConfig } from '../src/db/setup'
import type { HubConfig } from '../src/types'

// Mock the mkdir function from node:fs/promises
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined)
}))

describe('resolveDatabaseConfig', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const createMockNuxt = (layers: any[] = []) => ({
    options: {
      rootDir: '/',
      srcDir: '/app/',
      _layers: layers
    }
  }) as any

  const createBaseHubConfig = (db: HubConfig['db']): HubConfig => ({
    blob: false,
    cache: false,
    db,
    kv: false,
    dir: '/tmp/test-hub',
    hosting: ''
  })

  describe('db disabled', () => {
    it('should return false when db is false', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig(false)

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toBe(false)
    })
  })

  describe('SQLite dialect', () => {
    it('should resolve sqlite from string', async () => {
      const nuxt = createMockNuxt([
        { config: { srcDir: '/app', rootDir: '/app', serverDir: '/app/server' } }
      ])
      const hub = createBaseHubConfig('sqlite')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'file:/tmp/test-hub/db/sqlite.db'
        },
        applyMigrationsDuringBuild: true
      })
      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.migrationsDirs).toEqual(['/app/server/db/migrations'])
        expect(result.queriesPaths).toEqual([])
      }
    })

    it('should resolve sqlite from object config', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({ dialect: 'sqlite' })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'file:/tmp/test-hub/db/sqlite.db'
        }
      })
    })

    it('should use Turso when TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set', async () => {
      process.env.TURSO_DATABASE_URL = 'libsql://my-db.turso.io'
      process.env.TURSO_AUTH_TOKEN = 'my-auth-token'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('sqlite')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'libsql://my-db.turso.io',
          authToken: 'my-auth-token'
        }
      })
    })

    it('should use D1 driver when hosting is cloudflare', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('sqlite')
      hub.hosting = 'cloudflare'

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'd1',
        applyMigrationsDuringBuild: false // D1 disables migrations during build
      })
    })

    it('should preserve custom driver when specified', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        driver: 'better-sqlite3'
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'better-sqlite3'
      })
    })

    it('should preserve custom connection options', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        connection: {
          url: 'file:/custom/path.db'
        }
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'file:/custom/path.db'
        }
      })
    })

    it('should allow libsql without env vars for lazy resolution (K8s/Docker)', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        driver: 'libsql',
        applyMigrationsDuringBuild: false
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: { url: '' },
        applyMigrationsDuringBuild: false
      })
    })
  })

  describe('PostgreSQL dialect', () => {
    it('should use postgres-js driver when DATABASE_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('postgresql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'postgres-js',
        connection: {
          url: 'postgresql://user:pass@localhost:5432/db'
        }
      })
    })

    it('should use postgres-js driver when POSTGRES_URL is set', async () => {
      process.env.POSTGRES_URL = 'postgresql://user:pass@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('postgresql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'postgres-js',
        connection: {
          url: 'postgresql://user:pass@localhost:5432/db'
        }
      })
    })

    it('should use postgres-js driver when POSTGRESQL_URL is set', async () => {
      process.env.POSTGRESQL_URL = 'postgresql://user:pass@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('postgresql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'postgres-js',
        connection: {
          url: 'postgresql://user:pass@localhost:5432/db'
        }
      })
    })

    it('should fallback to pglite when no DATABASE_URL is set', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('postgresql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'pglite',
        connection: {
          dataDir: '/tmp/test-hub/db/pglite'
        }
      })
    })

    it('should preserve custom driver when specified', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'postgresql',
        driver: 'custom-postgres'
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'custom-postgres'
      })
    })

    it('should use neon-http driver when explicitly set', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'postgresql',
        driver: 'neon-http'
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'neon-http',
        connection: {
          url: 'postgresql://user:pass@localhost:5432/db'
        }
      })
    })

    it('should not use neon-http driver automatically', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('postgresql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'postgres-js',
        connection: {
          url: 'postgresql://user:pass@localhost:5432/db'
        }
      })
    })

    it('should throw error when DATABASE_URL is not set for neon-http with applyMigrationsDuringBuild', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'postgresql',
        driver: 'neon-http',
        applyMigrationsDuringBuild: true
      })

      await expect(resolveDatabaseConfig(nuxt, hub)).rejects.toThrow(
        '`neon-http` driver requires `DATABASE_URL`, `POSTGRES_URL`, or `POSTGRESQL_URL` environment variable when `applyMigrationsDuringBuild` is enabled'
      )
    })

    it('should allow neon-http without DATABASE_URL when applyMigrationsDuringBuild is false', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'postgresql',
        driver: 'neon-http',
        applyMigrationsDuringBuild: false
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'neon-http',
        applyMigrationsDuringBuild: false
      })
    })

    it('should allow postgres-js without DATABASE_URL when applyMigrationsDuringBuild is false', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'postgresql',
        driver: 'postgres-js',
        applyMigrationsDuringBuild: false
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'postgresql',
        driver: 'postgres-js',
        applyMigrationsDuringBuild: false
      })
    })
  })

  describe('MySQL dialect', () => {
    it('should resolve mysql with DATABASE_URL', async () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('mysql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'mysql',
        driver: 'mysql2',
        connection: {
          uri: 'mysql://user:pass@localhost:3306/db'
        }
      })
    })

    it('should resolve mysql with MYSQL_URL', async () => {
      process.env.MYSQL_URL = 'mysql://user:pass@localhost:3306/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('mysql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'mysql',
        driver: 'mysql2',
        connection: {
          uri: 'mysql://user:pass@localhost:3306/db'
        }
      })
    })

    it('should throw error when no DATABASE_URL or MYSQL_URL is set with applyMigrationsDuringBuild', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'mysql',
        applyMigrationsDuringBuild: true
      })

      await expect(resolveDatabaseConfig(nuxt, hub)).rejects.toThrow(
        'MySQL requires DATABASE_URL or MYSQL_URL environment variable when `applyMigrationsDuringBuild` is enabled'
      )
    })

    it('should allow mysql2 without DATABASE_URL when applyMigrationsDuringBuild is false', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'mysql',
        applyMigrationsDuringBuild: false
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'mysql',
        driver: 'mysql2',
        applyMigrationsDuringBuild: false
      })
    })

    it('should preserve custom driver when specified', async () => {
      process.env.MYSQL_URL = 'mysql://user:pass@localhost:3306/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'mysql',
        driver: 'custom-mysql'
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'mysql',
        driver: 'custom-mysql'
      })
    })
  })

  describe('custom configurations', () => {
    it('should merge custom migrationsDirs with layer defaults', async () => {
      const nuxt = createMockNuxt([
        { config: { srcDir: '/app', rootDir: '/app', serverDir: '/app/server' } }
      ])
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        migrationsDirs: ['/custom/migrations']
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      // defu merges arrays, so custom dirs come first, then layer defaults
      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.migrationsDirs).toEqual(['/custom/migrations', '/app/server/db/migrations'])
      }
    })

    it('should use custom queriesPaths', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        queriesPaths: ['/custom/queries/seed.sql']
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.queriesPaths).toEqual(['/custom/queries/seed.sql'])
      }
    })

    it('should respect custom applyMigrationsDuringBuild', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        applyMigrationsDuringBuild: false
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.applyMigrationsDuringBuild).toBe(false)
      }
    })

    it('should handle multiple layers for migrationsDirs', async () => {
      const nuxt = createMockNuxt([
        { config: { srcDir: '/app', rootDir: '/app', serverDir: '/app/server' } },
        { config: { srcDir: '/layer1', rootDir: '/layer1', serverDir: '/layer1/server' } },
        { config: { srcDir: '/layer2', rootDir: '/layer2', serverDir: '/layer2/server' } }
      ])
      const hub = createBaseHubConfig('sqlite')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.migrationsDirs).toEqual([
          '/app/server/db/migrations',
          '/layer1/server/db/migrations',
          '/layer2/server/db/migrations'
        ])
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty layers', async () => {
      const nuxt = createMockNuxt([])
      const hub = createBaseHubConfig('sqlite')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.migrationsDirs).toEqual([])
      }
    })

    it('should use D1 driver when explicitly specified with cloudflare hosting', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        driver: 'd1'
      })
      hub.hosting = 'cloudflare'

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'd1',
        applyMigrationsDuringBuild: false
      })
    })

    it('should prioritize Turso over Cloudflare D1 when both are available', async () => {
      process.env.TURSO_DATABASE_URL = 'libsql://my-db.turso.io'
      process.env.TURSO_AUTH_TOKEN = 'my-auth-token'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('sqlite')
      hub.hosting = 'cloudflare'

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'libsql://my-db.turso.io',
          authToken: 'my-auth-token'
        }
      })
    })

    it('should prioritize POSTGRES_URL over DATABASE_URL', async () => {
      process.env.DATABASE_URL = 'postgresql://fallback@localhost:5432/db'
      process.env.POSTGRES_URL = 'postgresql://priority@localhost:5432/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('postgresql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.connection?.url).toBe('postgresql://priority@localhost:5432/db')
      }
    })

    it('should prioritize MYSQL_URL over DATABASE_URL', async () => {
      process.env.DATABASE_URL = 'mysql://fallback@localhost:3306/db'
      process.env.MYSQL_URL = 'mysql://priority@localhost:3306/db'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('mysql')

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.connection?.uri).toBe('mysql://priority@localhost:3306/db')
      }
    })

    it('should handle complex custom connection objects', async () => {
      // Set DATABASE_URL to avoid fall-through to mysql error
      process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          user: 'testuser',
          password: 'testpass',
          database: 'testdb',
          ssl: { rejectUnauthorized: false }
        }
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.connection).toMatchObject({
          host: 'localhost',
          port: 5432,
          user: 'testuser',
          password: 'testpass',
          database: 'testdb',
          ssl: { rejectUnauthorized: false },
          url: 'postgresql://localhost:5432/testdb'
        })
      }
    })

    it('should handle sqlite with only TURSO_DATABASE_URL (no auth token)', async () => {
      process.env.TURSO_DATABASE_URL = 'libsql://my-db.turso.io'
      delete process.env.TURSO_AUTH_TOKEN

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('sqlite')

      const result = await resolveDatabaseConfig(nuxt, hub)

      // Without auth token, Turso condition isn't met, falls back to local SQLite
      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'file:/tmp/test-hub/db/sqlite.db'
        }
      })
    })

    it('should handle sqlite with only TURSO_AUTH_TOKEN (no URL)', async () => {
      delete process.env.TURSO_DATABASE_URL
      process.env.TURSO_AUTH_TOKEN = 'my-token'

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig('sqlite')

      const result = await resolveDatabaseConfig(nuxt, hub)

      // Without URL, Turso condition isn't met, falls back to local SQLite
      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'libsql',
        connection: {
          url: 'file:/tmp/test-hub/db/sqlite.db'
        }
      })
    })

    it('should handle different cloudflare hosting formats', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        driver: 'd1'
      })
      hub.hosting = 'cloudflare-pages'

      const result = await resolveDatabaseConfig(nuxt, hub)

      expect(result).toMatchObject({
        dialect: 'sqlite',
        driver: 'd1'
      })
    })

    it('should handle empty string as db connection URL with applyMigrationsDuringBuild', async () => {
      process.env.DATABASE_URL = ''

      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'mysql',
        applyMigrationsDuringBuild: true
      })

      await expect(resolveDatabaseConfig(nuxt, hub)).rejects.toThrow(
        'MySQL requires DATABASE_URL or MYSQL_URL environment variable when `applyMigrationsDuringBuild` is enabled'
      )
    })

    it('should always set applyMigrationsDuringBuild to false for D1', async () => {
      const nuxt = createMockNuxt()
      const hub = createBaseHubConfig({
        dialect: 'sqlite',
        driver: 'd1',
        applyMigrationsDuringBuild: true
      })

      const result = await resolveDatabaseConfig(nuxt, hub)

      // D1 always sets applyMigrationsDuringBuild to false (lines 66-68)
      expect(result).not.toBe(false)
      if (result !== false) {
        expect(result.applyMigrationsDuringBuild).toBe(false)
      }
    })
  })
})
