import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { setup } from '@nuxt/test-utils'

const fixtureRoot = fileURLToPath(new URL('./fixtures/postgres-runtime', import.meta.url))
const dbClientPath = fileURLToPath(new URL('./fixtures/postgres-runtime/node_modules/@nuxthub/db/db.mjs', import.meta.url))
const postgresEnvVariables = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSERNAME', 'PGUSER', 'PGPASSWORD'] as const
const databaseEnvVariables = ['POSTGRES_URL', 'POSTGRESQL_URL', 'DATABASE_URL', ...postgresEnvVariables] as const
const originalEnv = { ...process.env }

for (const name of databaseEnvVariables) process.env[name] = ''

async function importDbClientModule(stubs: {
  postgres: (...args: unknown[]) => unknown
  drizzle: (...args: unknown[]) => unknown
}) {
  const dbClient = await readFile(dbClientPath, 'utf8')
  const tempDir = await mkdtemp(join(tmpdir(), 'nuxthub-postgres-runtime-'))
  const tempModulePath = join(tempDir, 'db.mjs')

  const rewrittenDbClient = dbClient
    .replace(`from 'drizzle-orm/postgres-js'`, `from './drizzle-stub.mjs'`)
    .replace(`from 'postgres'`, `from './postgres-stub.mjs'`)

  // @ts-expect-error - test-only global stub registry
  globalThis.__nuxthubPostgresRuntimeTestStubs = stubs

  await writeFile(tempModulePath, rewrittenDbClient)
  await writeFile(join(tempDir, 'postgres-stub.mjs'), `export default (...args) => globalThis.__nuxthubPostgresRuntimeTestStubs.postgres(...args)\n`)
  await writeFile(join(tempDir, 'drizzle-stub.mjs'), `export const drizzle = (...args) => globalThis.__nuxthubPostgresRuntimeTestStubs.drizzle(...args)\n`)
  await writeFile(join(tempDir, 'schema.mjs'), `export const schemaMarker = true\n`)

  return {
    module: await import(`${pathToFileURL(tempModulePath).href}?t=${Date.now()}-${Math.random()}`),
    cleanup: () => rm(tempDir, { recursive: true, force: true })
  }
}

describe('postgres runtime client', async () => {
  await setup({
    rootDir: fixtureRoot,
    dev: false
  })

  afterEach(() => {
    vi.restoreAllMocks()
    for (const name of databaseEnvVariables) process.env[name] = ''
    // @ts-expect-error - test-only global cleanup
    delete globalThis.__nuxthubPostgresRuntimeTestStubs
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it.each(postgresEnvVariables)('uses postgres options with %s', async (name) => {
    process.env[name] = 'test-value'
    const postgresMock = vi.fn(() => ({}))
    const { module, cleanup } = await importDbClientModule({
      postgres: postgresMock,
      drizzle: vi.fn(() => ({ select: true }))
    })

    try {
      void module.db.select

      expect(postgresMock).toHaveBeenCalledOnce()
      expect(postgresMock).toHaveBeenCalledWith(expect.objectContaining({ prepare: false }))
    } finally {
      await cleanup()
    }
  })

  it('keeps connection URLs authoritative', async () => {
    process.env.POSTGRES_URL = 'postgresql://example.test/database'
    process.env.PGHOST = 'ignored.example.test'
    const postgresMock = vi.fn(() => ({}))
    const { module, cleanup } = await importDbClientModule({
      postgres: postgresMock,
      drizzle: vi.fn(() => ({ select: true }))
    })

    try {
      void module.db.select

      expect(postgresMock).toHaveBeenCalledWith(
        'postgresql://example.test/database',
        expect.objectContaining({ prepare: false })
      )
    } finally {
      await cleanup()
    }
  })

  it('retains the missing configuration error', async () => {
    const postgresMock = vi.fn()
    const { module, cleanup } = await importDbClientModule({
      postgres: postgresMock,
      drizzle: vi.fn()
    })

    try {
      expect(() => module.db.select).toThrow('[nuxt-hub] DATABASE_URL, POSTGRES_URL, or POSTGRESQL_URL required')
      expect(postgresMock).not.toHaveBeenCalled()
    } finally {
      await cleanup()
    }
  })
})
