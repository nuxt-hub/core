import { beforeEach, describe, expect, it, vi } from 'vitest'

const addServerHandler = vi.fn()
const createResolver = vi.fn(() => ({
  resolve: (path: string) => `/resolved/${path}`
}))

vi.mock('@nuxt/kit', () => ({
  addServerHandler,
  createResolver
}))

describe('setupDevTools', () => {
  beforeEach(() => {
    addServerHandler.mockClear()
    createResolver.mockClear()
  })

  it('registers hosted KV index and cache clear routes explicitly', async () => {
    const { setupDevTools } = await import('../src/devtools/setup')

    await setupDevTools({
      options: {
        dev: true,
        test: false,
        devServer: {}
      }
    } as any, {
      kv: true,
      cache: true,
      blob: false,
      devtools: {}
    } as any)

    expect(addServerHandler).toHaveBeenCalledWith(expect.objectContaining({
      route: '/api/_hub/kv',
      method: 'get',
      handler: '/resolved/../devtools-runtime/server/api/_hub/kv/[...key]'
    }))

    expect(addServerHandler).toHaveBeenCalledWith(expect.objectContaining({
      route: '/api/_hub/cache/clear',
      method: 'delete',
      handler: '/resolved/../devtools-runtime/server/api/_hub/cache/clear.delete'
    }))
  })
})
