import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Open API', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/openapi', import.meta.url)),
    dev: true
  })

  it('Fetch Open API JSON', async () => {
    const manifest = await $fetch<any>('/_openapi.json')
    expect(manifest).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Nitro Server Routes'
      }
    })
  })
})
