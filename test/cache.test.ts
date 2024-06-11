import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { version } from '../package.json'

const cacheListFields = ['duration', 'expires', 'integrity', 'key', 'mtime', 'size']

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
      version,
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
    expect(result).toMatchObject({ functions: 0, handlers: 0 })
  })

  describe('Trigger Cached functions & handlers', () => {
    it('Cached function', async () => {
      const result = await $fetch('/api/cached')
      expect(result).toMatchObject({ hello: 'world' })

      const result2 = await $fetch('/api/_hub/cache')
      expect(result2).toMatchObject({ functions: 0, handlers: 1 })

      const handlers = await $fetch('/api/_hub/cache/handlers')
      expect(handlers).toMatchObject({ cache: [], groups: { _: 1 } })

      const handlers_ = await $fetch<Record<string, any>>('/api/_hub/cache/handlers/_')
      expect(handlers_.cache.length).greaterThan(0)

      cacheListFields.forEach(key => expect(handlers_.cache[0]).toHaveProperty(key))
    })
  })
})

async function cleanUp() {
  await fs.rm(fileURLToPath(new URL('./fixtures/cache/.data/cache', import.meta.url)), { force: true, recursive: true })
}
