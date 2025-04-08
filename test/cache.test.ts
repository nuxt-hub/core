import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

const cacheListFields = ['duration', 'expires', 'key', 'mtime', 'size']

describe('KV', async () => {
  // clean up
  await cleanUp()

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/cache', import.meta.url)),
    dev: true
  })

  it('Check manifest (Cache is enabled)', async () => {
    const manifest = await $fetch('/api/_hub/manifest')
    expect(manifest).toMatchObject({
      storage: {
        database: false,
        kv: false,
        blob: false
      },
      features: {
        cache: true
      }
    })
  })

  it('Fetch Keys List (empty)', async () => {
    const result = await $fetch('/api/_hub/cache')
    expect(result).toMatchObject({})
  })

  describe('Trigger Cached functions & handlers', () => {
    it('Cached function', async () => {
      const result = await $fetch('/api/cached')
      expect(result).toMatchObject({ hello: 'world' })

      const entries = await $fetch('/api/_hub/cache')
      expect(entries).toMatchObject({ nitro: 1 })

      const nitro = await $fetch('/api/_hub/cache/nitro')
      expect(nitro).toMatchObject({ cache: [], groups: { handlers: 1 } })

      const handlers = await $fetch('/api/_hub/cache/nitro/handlers')
      expect(handlers).toMatchObject({ cache: [], groups: { _: 1 } })

      const handlers_ = await $fetch<any>('/api/_hub/cache/nitro/handlers/_')
      expect(handlers_.cache.length).greaterThan(0)

      cacheListFields.forEach(key => expect(handlers_.cache[0]).toHaveProperty(key))
    })
  })
})

async function cleanUp() {
  await fs.rm(fileURLToPath(new URL('./fixtures/cache/.data/cache', import.meta.url)), { force: true, recursive: true })
}
