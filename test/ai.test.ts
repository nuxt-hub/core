import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe.skip('Ai', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/ai', import.meta.url)),
    dev: true
  })

  it('Check manifest (Ai is enabled)', async () => {
    const manifest = await $fetch('/api/_hub/manifest')
    expect(manifest).toMatchObject({
      storage: {
        database: false,
        kv: false,
        blob: false
      },
      features: {
        ai: 'cloudflare',
        analytics: false,
        cache: false
      }
    })
  })
})
