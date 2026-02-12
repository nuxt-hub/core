import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setup, useTestContext } from '@nuxt/test-utils'
import { addWranglerBinding } from '../src/utils'

describe('addWranglerBinding', () => {
  it('should not add duplicate bindings', () => {
    const nuxt = { options: { nitro: {} } } as any
    addWranglerBinding(nuxt, 'kv_namespaces', { binding: 'KV', id: 'first' })
    addWranglerBinding(nuxt, 'kv_namespaces', { binding: 'KV', id: 'second' })
    expect(nuxt.options.nitro.cloudflare.wrangler.kv_namespaces).toHaveLength(1)
  })
})

describe('wrangler bindings e2e', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/wrangler', import.meta.url)),
    dev: true,
    server: false,
    setupTimeout: 240_000
  })

  it('should auto-generate all wrangler bindings from hub config', () => {
    const { nuxt } = useTestContext()
    const wrangler = nuxt?.options.nitro.cloudflare?.wrangler

    expect(wrangler?.r2_buckets).toContainEqual({ binding: 'BLOB', bucket_name: 'test-bucket' })
    expect(wrangler?.kv_namespaces).toContainEqual({ binding: 'KV', id: 'test-kv-id' })
    expect(wrangler?.kv_namespaces).toContainEqual({ binding: 'CACHE', id: 'test-cache-id' })
    expect(wrangler?.d1_databases).toContainEqual({ binding: 'DB', database_id: 'test-db-id' })
  })
})
