import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Analytics', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/analytics', import.meta.url)),
    dev: true
  })

  it('Check manifest (Analytics is enabled)', async () => {
    const manifest = await $fetch('/api/_hub/manifest')
    expect(manifest).toMatchObject({
      storage: {
        database: false,
        kv: false,
        blob: false
      },
      features: {
        analytics: true,
        cache: false
      }
    })
  })
})
