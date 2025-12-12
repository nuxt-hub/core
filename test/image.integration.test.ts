import { describe, it, expect } from 'vitest'
import buildConfig from '../build.config'
import { setupImage } from '../src/image/setup'

describe('Image integration', () => {
  it('ships image runtime provider in build config', () => {
    const configs = buildConfig as any[]
    const entries = configs[0]?.entries as any[]
    const hasImageRuntime = entries.some((entry) => {
      return typeof entry === 'object'
        && entry.input === 'src/image/runtime/'
        && entry.outDir === 'dist/image/runtime'
    })
    expect(hasImageRuntime).toBe(true)
  })

  it('registers nuxthub provider only when image.path is set', async () => {
    const deps = { '@nuxt/image': '^2.0.0' }

    const nuxtNoPath: any = { options: { _prepare: false, dev: false } }
    const hubNoPath: any = { blob: { driver: 'fs' } }
    await setupImage(nuxtNoPath, hubNoPath, deps)
    expect(nuxtNoPath.options.image).toBeUndefined()

    const nuxtWithPath: any = { options: { _prepare: false, dev: false } }
    const hubWithPath: any = { blob: { driver: 'fs', image: { path: 'images/' } } }
    await setupImage(nuxtWithPath, hubWithPath, deps)

    expect(nuxtWithPath.options.image.provider).toBe('nuxthub')
    expect(nuxtWithPath.options.image.providers?.nuxthub).toBeDefined()
    expect(nuxtWithPath.options.image.providers.nuxthub.provider).toContain('image/runtime/provider')
    expect(nuxtWithPath.options.image.providers.nuxthub.options).toMatchObject({
      driver: 'fs',
      path: '/images'
    })
  })

  it('skips setup when @nuxt/image is not installed', async () => {
    const deps = {} // no @nuxt/image
    const nuxt: any = { options: { _prepare: false, dev: false } }
    const hub: any = { blob: { driver: 'fs', image: { path: '/images' } } }
    await setupImage(nuxt, hub, deps)
    expect(nuxt.options.image).toBeUndefined()
  })
})
