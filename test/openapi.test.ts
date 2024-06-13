import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Open API', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/openapi', import.meta.url)),
    dev: true
  })

  it('Fetch Open API JSON', async () => {
    const manifest = await $fetch<any>('/api/_hub/openapi')
    expect(manifest).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Nitro Server Routes'
      }
    })

    const routes = Object.keys(manifest.paths)
    expect(routes).not.includes('/api/_hub/analytics')
    expect(routes).not.includes('/api/_hub/blob')
    expect(routes).not.includes('/api/_hub/cache')
    expect(routes).not.includes('/api/_hub/kv/{path}')
    // Should include fallback route
    expect(routes).includes('/api/_hub/{feature}')
  })
})
