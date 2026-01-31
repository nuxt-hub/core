import { describe, expect, it } from 'vitest'
import { resolveKVConfig } from '../src/kv/setup'
import { resolveCacheConfig } from '../src/cache/setup'
import { resolveBlobConfig } from '../src/blob/setup'
import type { HubConfig } from '../src/types'

describe('resolveKVConfig', () => {
  const createBaseConfig = (kv: HubConfig['kv']): HubConfig => ({
    blob: false,
    cache: false,
    db: false,
    kv,
    dir: '/tmp/test',
    hosting: ''
  })

  it('returns false when kv is false', () => {
    const hub = createBaseConfig(false)
    expect(resolveKVConfig(hub)).toBe(false)
  })

  it('uses fs-lite by default (non-cloudflare)', () => {
    const hub = createBaseConfig(true)
    expect(resolveKVConfig(hub)).toMatchObject({
      driver: 'fs-lite',
      base: '.data/kv'
    })
  })

  it('uses cloudflare-kv-binding when hosting is cloudflare', () => {
    const hub = createBaseConfig(true)
    hub.hosting = 'cloudflare'
    expect(resolveKVConfig(hub)).toMatchObject({
      driver: 'cloudflare-kv-binding',
      binding: 'KV'
    })
  })

  it('auto-detects cloudflare-kv-binding when namespaceId present (non-cloudflare)', () => {
    const hub = createBaseConfig({ namespaceId: 'test-kv-id' })
    // Note: hosting is empty string
    expect(resolveKVConfig(hub)).toMatchObject({
      driver: 'cloudflare-kv-binding',
      binding: 'KV',
      namespaceId: 'test-kv-id'
    })
  })

  it('preserves user driver when specified', () => {
    const hub = createBaseConfig({ driver: 'redis', url: 'redis://localhost' })
    expect(resolveKVConfig(hub)).toMatchObject({
      driver: 'redis',
      url: 'redis://localhost'
    })
  })
})

describe('resolveCacheConfig', () => {
  const createBaseConfig = (cache: HubConfig['cache']): HubConfig => ({
    blob: false,
    cache,
    db: false,
    kv: false,
    dir: '/tmp/test',
    hosting: ''
  })

  it('returns false when cache is false', () => {
    const hub = createBaseConfig(false)
    expect(resolveCacheConfig(hub)).toBe(false)
  })

  it('uses fs-lite by default (non-cloudflare)', () => {
    const hub = createBaseConfig(true)
    expect(resolveCacheConfig(hub)).toMatchObject({
      driver: 'fs-lite',
      base: '/tmp/test/cache'
    })
  })

  it('uses cloudflare-kv-binding when hosting is cloudflare', () => {
    const hub = createBaseConfig(true)
    hub.hosting = 'cloudflare'
    expect(resolveCacheConfig(hub)).toMatchObject({
      driver: 'cloudflare-kv-binding',
      binding: 'CACHE'
    })
  })

  it('auto-detects cloudflare-kv-binding when namespaceId present (non-cloudflare)', () => {
    const hub = createBaseConfig({ namespaceId: 'test-cache-id' })
    // Note: hosting is empty string
    expect(resolveCacheConfig(hub)).toMatchObject({
      driver: 'cloudflare-kv-binding',
      binding: 'CACHE',
      namespaceId: 'test-cache-id'
    })
  })

  it('preserves user driver when specified', () => {
    const hub = createBaseConfig({ driver: 'memory' })
    expect(resolveCacheConfig(hub)).toMatchObject({ driver: 'memory' })
  })
})

describe('resolveBlobConfig', () => {
  const createBaseConfig = (blob: HubConfig['blob']): HubConfig => ({
    blob,
    cache: false,
    db: false,
    kv: false,
    dir: '/tmp/test',
    hosting: ''
  })

  it('returns false when blob is false', () => {
    const hub = createBaseConfig(false)
    expect(resolveBlobConfig(hub, {})).toBe(false)
  })

  it('uses fs by default (non-cloudflare)', () => {
    const hub = createBaseConfig(true)
    expect(resolveBlobConfig(hub, {})).toMatchObject({
      driver: 'fs',
      dir: '/tmp/test/blob'
    })
  })

  it('uses cloudflare-r2 when hosting is cloudflare', () => {
    const hub = createBaseConfig(true)
    hub.hosting = 'cloudflare'
    expect(resolveBlobConfig(hub, {})).toMatchObject({
      driver: 'cloudflare-r2',
      binding: 'BLOB'
    })
  })

  it('auto-detects cloudflare-r2 when bucketName present (non-cloudflare)', () => {
    const hub = createBaseConfig({ driver: 'cloudflare-r2', bucketName: 'test-bucket' })
    // Note: hosting is empty string
    expect(resolveBlobConfig(hub, {})).toMatchObject({
      driver: 'cloudflare-r2',
      bucketName: 'test-bucket'
    })
  })

  it('preserves user driver when specified', () => {
    const hub = createBaseConfig({ driver: 's3', bucket: 'my-bucket', accessKeyId: 'key', secretAccessKey: 'secret', region: 'us-east-1' })
    expect(resolveBlobConfig(hub, { aws4fetch: '1.0.0' })).toMatchObject({
      driver: 's3',
      bucket: 'my-bucket'
    })
  })
})
