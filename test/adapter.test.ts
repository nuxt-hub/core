import { describe, expect, it } from 'vitest'
import type { Nuxt } from '@nuxt/schema'
import { getAdapter, getAvailableAdapters, registerAdapter } from '../src/db/adapters/interface'
import type { HubDbAdapterContext, Driver, OrmType } from '../src/db/adapters/interface'
import type { ResolvedHubConfig, ResolvedDatabaseConfig } from '../src/types/config'
import { drizzleAdapter } from '../src/db/adapters/drizzle'
import { prismaAdapter } from '../src/db/adapters/prisma'

type MockContextOptions = {
  driver: Driver
  dialect?: 'sqlite' | 'postgresql' | 'mysql'
  orm?: OrmType
  connection?: Record<string, unknown>
  casing?: 'snake_case' | 'camelCase'
  mode?: 'default' | 'planetscale'
  hosting?: string
  dev?: boolean
}

function createMockContext(options: MockContextOptions): HubDbAdapterContext {
  return {
    nuxt: { options: { dev: options.dev ?? false, rootDir: '/app' } } as Nuxt,
    hub: { hosting: options.hosting ?? '', dir: '/tmp' } as ResolvedHubConfig,
    dbConfig: {
      orm: options.orm ?? 'drizzle',
      dialect: options.dialect ?? 'sqlite',
      driver: options.driver,
      connection: options.connection ?? {},
      casing: options.casing,
      mode: options.mode,
      migrationsDirs: [],
      queriesPaths: [],
      applyMigrationsDuringBuild: true
    } as ResolvedDatabaseConfig
  }
}

describe('Adapter Interface', () => {
  describe('getAvailableAdapters', () => {
    it('should return drizzle and prisma as available adapters', () => {
      const adapters = getAvailableAdapters()
      expect(adapters).toContain('drizzle')
      expect(adapters).toContain('prisma')
    })
  })

  describe('getAdapter', () => {
    it('should return drizzle adapter', async () => {
      const adapter = await getAdapter('drizzle')
      expect(adapter.name).toBe('drizzle')
    })

    it('should return prisma adapter', async () => {
      const adapter = await getAdapter('prisma')
      expect(adapter.name).toBe('prisma')
    })

    it('should throw for unknown adapter', async () => {
      // @ts-expect-error - testing invalid input
      await expect(getAdapter('unknown')).rejects.toThrow('Unknown ORM adapter: unknown')
    })
  })

  describe('registerAdapter', () => {
    it('should allow registering custom adapters', () => {
      // @ts-expect-error - testing extension point with custom adapter name
      registerAdapter('custom', async () => ({ ...drizzleAdapter, name: 'custom' }))
      expect(getAvailableAdapters()).toContain('custom')
    })
  })
})

describe('Drizzle Adapter', () => {
  describe('checkMissingDeps', () => {
    it('should return empty array when all deps are installed', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0', '@libsql/client': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'libsql')
      expect(missing).toEqual([])
    })

    it('should return missing core drizzle deps', () => {
      const missing = drizzleAdapter.checkMissingDeps({}, 'libsql')
      expect(missing).toContain('drizzle-orm')
      expect(missing).toContain('drizzle-kit')
    })

    it('should return missing postgres driver dep', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'postgres-js')
      expect(missing).toContain('postgres')
    })

    it('should return missing pglite driver dep', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'pglite')
      expect(missing).toContain('@electric-sql/pglite')
    })

    it('should return missing neon-http driver dep', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'neon-http')
      expect(missing).toContain('@neondatabase/serverless')
    })

    it('should return missing mysql2 driver dep', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'mysql2')
      expect(missing).toContain('mysql2')
    })

    it('should return missing libsql driver dep', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'libsql')
      expect(missing).toContain('@libsql/client')
    })

    it('should not require extra deps for d1 driver', () => {
      const deps = { 'drizzle-orm': '1.0.0', 'drizzle-kit': '1.0.0' }
      const missing = drizzleAdapter.checkMissingDeps(deps, 'd1')
      expect(missing).toEqual([])
    })
  })

  describe('createClientCode', () => {
    it('should generate libsql client code', () => {
      const ctx = createMockContext({ driver: 'libsql', connection: { url: 'file:test.db' } })
      const code = drizzleAdapter.createClientCode(ctx)
      expect(code).toContain('import { drizzle } from \'drizzle-orm/libsql\'')
      expect(code).toContain('export { db, schema, executeRaw, getRows }')
    })

    it('should generate d1 client code with lazy binding', () => {
      const ctx = createMockContext({ driver: 'd1' })
      const code = drizzleAdapter.createClientCode(ctx)
      expect(code).toContain('import { drizzle } from \'drizzle-orm/d1\'')
      expect(code).toContain('globalThis.__env__?.DB')
      expect(code).toContain('new Proxy')
    })

    it('should generate postgres-js client code', () => {
      const ctx = createMockContext({ driver: 'postgres-js', dialect: 'postgresql', connection: { url: 'postgres://localhost' } })
      const code = drizzleAdapter.createClientCode(ctx)
      expect(code).toContain('import { drizzle } from \'drizzle-orm/postgres-js\'')
    })

    it('should include casing option when specified', () => {
      const ctx = createMockContext({ driver: 'libsql', connection: { url: 'file:test.db' }, casing: 'snake_case' })
      const code = drizzleAdapter.createClientCode(ctx)
      expect(code).toContain('casing: \'snake_case\'')
    })

    it('should include mode option for mysql', () => {
      const ctx = createMockContext({ driver: 'mysql2', dialect: 'mysql', connection: { uri: 'mysql://localhost' }, mode: 'planetscale' })
      const code = drizzleAdapter.createClientCode(ctx)
      expect(code).toContain('mode: \'planetscale\'')
    })
  })

  describe('getClientTypes', () => {
    it('should generate proper type definitions', () => {
      const ctx = createMockContext({ driver: 'libsql' })
      const types = drizzleAdapter.getClientTypes(ctx)
      expect(types).toContain('declare module \'hub:db\'')
      expect(types).toContain('export { schema }')
      expect(types).toContain('drizzle-orm/libsql')
    })

    it('should use sqlite-proxy for d1-http driver types', () => {
      const ctx = createMockContext({ driver: 'd1-http' })
      const types = drizzleAdapter.getClientTypes(ctx)
      expect(types).toContain('drizzle-orm/sqlite-proxy')
    })
  })
})

describe('Prisma Adapter', () => {
  describe('checkMissingDeps', () => {
    it('should return empty array when all deps are installed for postgres-js', () => {
      const deps = { '@prisma/client': '5.0.0', prisma: '5.0.0' }
      const missing = prismaAdapter.checkMissingDeps(deps, 'postgres-js')
      expect(missing).toEqual([])
    })

    it('should return missing core prisma deps', () => {
      const missing = prismaAdapter.checkMissingDeps({}, 'postgres-js')
      expect(missing).toContain('@prisma/client')
      expect(missing).toContain('prisma')
    })

    it('should return missing d1 adapter dep', () => {
      const deps = { '@prisma/client': '5.0.0', prisma: '5.0.0' }
      const missing = prismaAdapter.checkMissingDeps(deps, 'd1')
      expect(missing).toContain('@prisma/adapter-d1')
    })

    it('should return missing pglite adapter dep', () => {
      const deps = { '@prisma/client': '5.0.0', prisma: '5.0.0' }
      const missing = prismaAdapter.checkMissingDeps(deps, 'pglite')
      expect(missing).toContain('@prisma/adapter-pg-lite')
    })

    it('should return missing libsql adapter deps', () => {
      const deps = { '@prisma/client': '5.0.0', prisma: '5.0.0' }
      const missing = prismaAdapter.checkMissingDeps(deps, 'libsql')
      expect(missing).toContain('@prisma/adapter-libsql')
      expect(missing).toContain('@libsql/client')
    })

    it('should return empty when all libsql deps installed', () => {
      const deps = { '@prisma/client': '5.0.0', prisma: '5.0.0', '@prisma/adapter-libsql': '5.0.0', '@libsql/client': '0.5.0' }
      const missing = prismaAdapter.checkMissingDeps(deps, 'libsql')
      expect(missing).toEqual([])
    })
  })

  describe('createClientCode', () => {
    it('should generate d1 client code with adapter', () => {
      const ctx = createMockContext({ driver: 'd1', orm: 'prisma' })
      const code = prismaAdapter.createClientCode(ctx)
      expect(code).toContain('const { PrismaClient } = pkg')
      expect(code).toContain('import { PrismaD1 } from \'@prisma/adapter-d1\'')
      expect(code).toContain('new Proxy')
    })

    it('should generate pglite client code with adapter', () => {
      const ctx = createMockContext({ driver: 'pglite', orm: 'prisma', dialect: 'postgresql', connection: { dataDir: '/tmp/pglite' } })
      const code = prismaAdapter.createClientCode(ctx)
      expect(code).toContain('const { PrismaClient } = pkg')
      expect(code).toContain('import { PrismaPGlite } from \'@prisma/adapter-pg-lite\'')
    })

    it('should generate default client code for other drivers', () => {
      const ctx = createMockContext({ driver: 'postgres-js', orm: 'prisma', dialect: 'postgresql', connection: { url: 'postgres://localhost' } })
      const code = prismaAdapter.createClientCode(ctx)
      expect(code).toContain('const { PrismaClient } = pkg')
      expect(code).toContain('new PrismaClient()')
    })
  })

  describe('getClientTypes', () => {
    it('should generate proper type definitions', () => {
      const ctx = createMockContext({ driver: 'd1', orm: 'prisma' })
      const types = prismaAdapter.getClientTypes(ctx)
      expect(types).toContain('declare module \'hub:db\'')
      expect(types).toContain('export const db: PrismaClient')
    })
  })

  describe('schemaPath', () => {
    it('should have correct default schema path', () => {
      expect(prismaAdapter.schemaPath).toBe('prisma/schema.prisma')
    })
  })
})
