import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils'

const fixtureRoot = fileURLToPath(new URL('./fixtures/hyperdrive-postgres', import.meta.url))

describe('hyperdrive postgres runtime client', async () => {
  await setup({
    rootDir: fixtureRoot,
    dev: true
  })

  it('generates a fresh postgres client for the cloudflare hyperdrive path', async () => {
    const dbClientPath = fileURLToPath(new URL('./fixtures/hyperdrive-postgres/node_modules/@nuxthub/db/db.mjs', import.meta.url))
    const dbClient = await readFile(dbClientPath, 'utf8')

    expect(dbClient).toContain(`import postgres from 'postgres'`)
    expect(dbClient).toContain('function getDb() {')
    expect(dbClient).toContain('const client = postgres(hyperdrive.connectionString')
    expect(dbClient).toContain('return drizzle({ client, schema')
    expect(dbClient).not.toContain('let _db')
  })
})
