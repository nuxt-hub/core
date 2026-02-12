import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createNitro, createDevServer, prepare, build, prerender } from 'nitropack/core'

const fixtureRoot = fileURLToPath(new URL('./fixtures/nitro-basic', import.meta.url))

describe('nitro module', () => {
  it('serves a route that can import hub:kv', async () => {
    const nitro = await createNitro({ rootDir: fixtureRoot, dev: true })
    const server = createDevServer(nitro)

    try {
      const listener = await server.listen(0)
      await prepare(nitro)
      await build(nitro)

      const res = await fetch(new URL('/api/ping', listener.url))
      expect(res.ok).toBe(true)
      const json = await res.json()
      expect(json).toMatchObject({ ok: true, value: { ok: true } })
    } finally {
      await server.close()
      await nitro.close()
    }
  })

  it('builds with cloudflare preset (minimal)', async () => {
    const nitro = await createNitro({
      rootDir: fixtureRoot,
      dev: false,
      preset: 'cloudflare',
      hub: { blob: false, cache: false, db: false, kv: false }
    })

    try {
      await prepare(nitro)
      await prerender(nitro)
      await build(nitro)
    } finally {
      await nitro.close()
    }
  })
})
