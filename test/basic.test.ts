import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    dev: true
  })

  it('Check all features are disabled', async () => {
    const manifest = await $fetch('/api/manifest')
    expect(manifest).toMatchObject({
      storage: {
        db: false,
        kv: false,
        blob: false
      },
      features: {
        cache: false
      }
    })
  })
})
