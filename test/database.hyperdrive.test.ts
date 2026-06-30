import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setup } from '@nuxt/test-utils'

const fixtureRoot = fileURLToPath(new URL('./fixtures/hyperdrive-postgres', import.meta.url))
const dbClientPath = fileURLToPath(new URL('./fixtures/hyperdrive-postgres/node_modules/@nuxthub/db/db.mjs', import.meta.url))

async function importDbClientModule(stubs: {
  postgres: (...args: unknown[]) => unknown
  drizzle: (...args: unknown[]) => unknown
  getEvent?: () => unknown
}) {
  const dbClient = await readFile(dbClientPath, 'utf8')
  const tempDir = await mkdtemp(join(tmpdir(), 'nuxthub-hyperdrive-postgres-'))
  const tempModulePath = join(tempDir, 'db.mjs')

  const rewrittenDbClient = dbClient
    .replace(`from 'drizzle-orm/postgres-js'`, `from './drizzle-stub.mjs'`)
    .replace(`from 'postgres'`, `from './postgres-stub.mjs'`)

  // @ts-expect-error - test-only global stub registry
  globalThis.__nuxthubHyperdriveTestStubs = stubs
  // @ts-expect-error - test-only global runtime bridge
  globalThis.__nuxthubUseNitroEvent = stubs.getEvent

  await writeFile(tempModulePath, rewrittenDbClient)
  await writeFile(join(tempDir, 'postgres-stub.mjs'), `export default (...args) => globalThis.__nuxthubHyperdriveTestStubs.postgres(...args)\n`)
  await writeFile(join(tempDir, 'drizzle-stub.mjs'), `export const drizzle = (...args) => globalThis.__nuxthubHyperdriveTestStubs.drizzle(...args)\n`)
  await writeFile(join(tempDir, 'schema.mjs'), `export const schemaMarker = true\n`)

  return {
    module: await import(`${pathToFileURL(tempModulePath).href}?t=${Date.now()}-${Math.random()}`),
    cleanup: () => rm(tempDir, { recursive: true, force: true })
  }
}

describe('hyperdrive postgres runtime client', async () => {
  await setup({
    rootDir: fixtureRoot,
    dev: true
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.POSTGRES
    // @ts-expect-error - test-only global cleanup
    delete globalThis.__env__
    // @ts-expect-error - test-only global cleanup
    delete globalThis.POSTGRES
    // @ts-expect-error - test-only global cleanup
    delete globalThis.__nuxthubHyperdriveTestStubs
    // @ts-expect-error - test-only global cleanup
    delete globalThis.__nuxthubUseNitroEvent
  })

  it('generates a fresh postgres client for the cloudflare hyperdrive path', async () => {
    const dbClient = await readFile(dbClientPath, 'utf8')

    expect(dbClient).toContain(`import postgres from 'postgres'`)
    expect(dbClient).not.toContain('nitropack/runtime/context')
    expect(dbClient).not.toContain('useEvent')
    expect(dbClient).toContain('globalThis.__nuxthubUseNitroEvent')
    expect(dbClient).toContain('context.__nuxthubHyperdrivePostgresDb ??= createDb(hyperdrive)')
    expect(dbClient).toContain('function getDb() {')
    expect(dbClient).toContain('function getRequestContext() {')
    expect(dbClient).toContain('function createDb(hyperdrive) {')
    expect(dbClient).toContain('const client = postgres(hyperdrive.connectionString')
    expect(dbClient).toContain('return drizzle({ client, schema')
    expect(dbClient).not.toContain('let _db')
  })

  it('reuses one postgres client within the same request context', async () => {
    // @ts-expect-error - test-only global binding
    globalThis.__env__ = { POSTGRES: { connectionString: 'postgres://hyperdrive/same-request' } }

    const postgresMock = vi.fn((connectionString: string) => ({ connectionString }))
    const drizzleMock = vi.fn(({ client }: { client: { connectionString: string } }) => ({
      select: () => client.connectionString,
      insert: () => client.connectionString
    }))
    const event = { context: {} as Record<string, unknown> }

    const { module, cleanup } = await importDbClientModule({
      postgres: postgresMock,
      drizzle: drizzleMock,
      getEvent: () => event
    })

    try {
      void module.db.select
      void module.db.insert

      expect(postgresMock).toHaveBeenCalledTimes(1)
      expect(drizzleMock).toHaveBeenCalledTimes(1)
      expect(event.context.__nuxthubHyperdrivePostgresDb).toBeDefined()
    } finally {
      await cleanup()
    }
  })

  it('creates a new postgres client for different request contexts', async () => {
    // @ts-expect-error - test-only global binding
    globalThis.__env__ = { POSTGRES: { connectionString: 'postgres://hyperdrive/different-requests' } }

    const postgresMock = vi.fn((connectionString: string) => ({ connectionString }))
    const drizzleMock = vi.fn(({ client }: { client: { connectionString: string } }) => ({
      select: () => client.connectionString
    }))
    let event = { context: {} as Record<string, unknown> }

    const { module, cleanup } = await importDbClientModule({
      postgres: postgresMock,
      drizzle: drizzleMock,
      getEvent: () => event
    })

    try {
      void module.db.select
      event = { context: {} as Record<string, unknown> }
      void module.db.select

      expect(postgresMock).toHaveBeenCalledTimes(2)
      expect(drizzleMock).toHaveBeenCalledTimes(2)
    } finally {
      await cleanup()
    }
  })

  it('falls back to non-cached clients when request context is unavailable', async () => {
    // @ts-expect-error - test-only global binding
    globalThis.__env__ = { POSTGRES: { connectionString: 'postgres://hyperdrive/no-context' } }

    const postgresMock = vi.fn((connectionString: string) => ({ connectionString }))
    const drizzleMock = vi.fn(({ client }: { client: { connectionString: string } }) => ({
      select: () => client.connectionString
    }))

    const { module, cleanup } = await importDbClientModule({
      postgres: postgresMock,
      drizzle: drizzleMock
    })

    try {
      void module.db.select
      void module.db.select

      expect(postgresMock).toHaveBeenCalledTimes(2)
      expect(drizzleMock).toHaveBeenCalledTimes(2)
    } finally {
      await cleanup()
    }
  })

  it('can be loaded by Jiti without resolving Nitro runtime context', async () => {
    const dbClient = await readFile(dbClientPath, 'utf8')
    const tempDir = await mkdtemp(join(tmpdir(), 'nuxthub-hyperdrive-postgres-jiti-'))
    const tempModulePath = join(tempDir, 'db.mjs')
    const nitropackDir = join(tempDir, 'node_modules/nitropack')

    const rewrittenDbClient = dbClient
      .replace(`from 'drizzle-orm/postgres-js'`, `from './drizzle-stub.mjs'`)
      .replace(`from 'postgres'`, `from './postgres-stub.mjs'`)

    try {
      await mkdir(nitropackDir, { recursive: true })
      await writeFile(tempModulePath, rewrittenDbClient)
      await writeFile(join(tempDir, 'postgres-stub.mjs'), `export default () => ({})\n`)
      await writeFile(join(tempDir, 'drizzle-stub.mjs'), `export const drizzle = () => ({})\n`)
      await writeFile(join(tempDir, 'schema.mjs'), `export const schemaMarker = true\n`)
      await writeFile(join(nitropackDir, 'package.json'), JSON.stringify({
        name: 'nitropack',
        version: '0.0.0',
        type: 'module',
        exports: {
          '.': './index.mjs'
        }
      }, null, 2))

      const jiti = createJiti(tempModulePath, { moduleCache: false })

      await expect(jiti.import(tempModulePath)).resolves.toHaveProperty('schema')
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
