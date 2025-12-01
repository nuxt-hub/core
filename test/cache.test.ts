import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('KV', async () => {
  await cleanUp()

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/cache', import.meta.url)),
    dev: true
  })

  it('Check cache is enabled', async () => {
    const manifest = await $fetch('/api/manifest')
    expect(manifest.cache).includes({
      driver: 'fs-lite',
    })
  })

  describe('Trigger Cached functions & handlers', () => {
    it('Cached function', async () => {
      const result = await $fetch('/api/cached')
      expect(result).toMatchObject({ hello: 'world' })
    })
  })
})

async function cleanUp() {
  await fs.rm(fileURLToPath(new URL('./fixtures/cache/.data/cache', import.meta.url)), { force: true, recursive: true })
}
