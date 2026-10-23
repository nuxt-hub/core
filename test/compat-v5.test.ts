import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

const rootDir = fileURLToPath(new URL('./fixtures/compat-v5', import.meta.url))

describe('future.compatibilityVersion: 5', async () => {
  await fs.rm(`${rootDir}/.data`, { force: true, recursive: true })

  await setup({
    rootDir,
    dev: true
  })

  it('enables all features', async () => {
    const manifest = await $fetch<Record<string, any>>('/api/manifest')
    expect(manifest.db).toMatchObject({ dialect: 'sqlite', driver: 'libsql' })
    expect(manifest.kv).toMatchObject({ driver: 'fs-lite' })
    expect(manifest.blob).toMatchObject({ driver: 'fs' })
    expect(manifest.cache).toMatchObject({ driver: 'fs-lite' })
  })

  it('applies migrations and uses the database and KV', async () => {
    const result = await $fetch('/api/smoke', { method: 'POST' })
    expect(result).toEqual({
      todo: { id: 1, title: 'compat v5' },
      kv: { ok: true }
    })
  })
})
