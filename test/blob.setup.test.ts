import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HubConfig } from '../src/types'
import { setupBlob } from '../src/blob/setup'

const {
  addImportsDir,
  addServerImports,
  addTypeTemplate,
  logWhenReady,
  addWranglerBinding
} = vi.hoisted(() => ({
  addImportsDir: vi.fn(),
  addServerImports: vi.fn(),
  addTypeTemplate: vi.fn(),
  logWhenReady: vi.fn(),
  addWranglerBinding: vi.fn()
}))

vi.mock('@nuxt/kit', () => ({
  addImportsDir,
  addServerImports,
  addTypeTemplate,
  logger: {
    withTag: () => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    })
  }
}))

vi.mock('../src/utils', () => ({
  resolve: (path: string) => join('/Users/maxi/nuxt/hub/src', path),
  logWhenReady,
  addWranglerBinding
}))

describe('setupBlob', () => {
  let rootDir: string

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-blob-'))
    addImportsDir.mockReset()
    addServerImports.mockReset()
    addTypeTemplate.mockReset()
    logWhenReady.mockReset()
    addWranglerBinding.mockReset()
  })

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true })
  })

  function createNuxt() {
    return {
      options: {
        rootDir,
        alias: {},
        runtimeConfig: {
          public: {}
        },
        vite: {},
        nitro: {},
        dev: false,
        _prepare: false
      }
    } as any
  }

  function createHub(): HubConfig {
    return {
      blob: true,
      cache: false,
      db: false,
      kv: false,
      dir: join(rootDir, '.data'),
      hosting: 'vercel'
    }
  }

  it('externalizes @vercel/blob/client for Vercel Blob without duplicates', async () => {
    const nuxt = createNuxt()
    const hub = createHub()
    const deps = {
      '@vercel/blob': '^2.2.0'
    }

    await setupBlob(nuxt, hub, deps)
    await setupBlob(nuxt, hub, deps)

    expect(nuxt.options.vite.optimizeDeps.exclude).toEqual(['@vercel/blob/client'])
    expect(nuxt.options.nitro.externals.external).toEqual(['@vercel/blob/client'])
    expect(nuxt.options.runtimeConfig.public.hub).toEqual({
      blobProvider: 'vercel-blob'
    })
  })
})
