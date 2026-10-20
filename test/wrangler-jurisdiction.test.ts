import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setup, useTestContext } from '@nuxt/test-utils'

describe('wrangler r2 jurisdiction e2e', async () => {
  await setup({ rootDir: fileURLToPath(new URL('./fixtures/wrangler-jurisdiction', import.meta.url)), dev: true })

  it('should include r2 jurisdiction when configured', () => {
    const { nuxt } = useTestContext()
    const wrangler = nuxt?.options.nitro.cloudflare?.wrangler

    expect(wrangler?.r2_buckets).toContainEqual({
      binding: 'BLOB',
      bucket_name: 'test-bucket',
      jurisdiction: 'eu'
    })
  })
})
