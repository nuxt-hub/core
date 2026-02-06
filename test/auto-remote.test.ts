import { describe, expect, it } from 'vitest'
import { hasRemoteBindingId } from '../src/utils'
import type { HubConfig } from '../src/types'

describe('hasRemoteBindingId', () => {
  const createBaseConfig = (overrides: Partial<HubConfig> = {}): HubConfig => ({
    blob: false,
    cache: false,
    db: false,
    kv: false,
    dir: '/tmp/test',
    hosting: '',
    ...overrides
  })

  it('returns false when no features are enabled', () => {
    const hub = createBaseConfig()
    expect(hasRemoteBindingId(hub)).toBe(false)
  })

  it('returns false when features are enabled but no binding IDs', () => {
    const hub = createBaseConfig({
      db: { dialect: 'sqlite' },
      kv: true,
      cache: true,
      blob: true
    })
    expect(hasRemoteBindingId(hub)).toBe(false)
  })

  describe('database', () => {
    it('detects databaseId', () => {
      const hub = createBaseConfig({
        db: { dialect: 'sqlite', connection: { databaseId: 'test-db-id' } }
      })
      expect(hasRemoteBindingId(hub)).toBe(true)
    })

    it('detects hyperdriveId', () => {
      const hub = createBaseConfig({
        db: { dialect: 'postgresql', connection: { hyperdriveId: 'test-hyperdrive-id' } }
      })
      expect(hasRemoteBindingId(hub)).toBe(true)
    })
  })

  describe('kv', () => {
    it('detects namespaceId', () => {
      const hub = createBaseConfig({
        kv: { namespaceId: 'test-kv-id' }
      })
      expect(hasRemoteBindingId(hub)).toBe(true)
    })

    it('ignores kv: true without namespaceId', () => {
      const hub = createBaseConfig({ kv: true })
      expect(hasRemoteBindingId(hub)).toBe(false)
    })
  })

  describe('cache', () => {
    it('detects namespaceId', () => {
      const hub = createBaseConfig({
        cache: { namespaceId: 'test-cache-id' }
      })
      expect(hasRemoteBindingId(hub)).toBe(true)
    })

    it('ignores cache: true without namespaceId', () => {
      const hub = createBaseConfig({ cache: true })
      expect(hasRemoteBindingId(hub)).toBe(false)
    })
  })

  describe('blob', () => {
    it('detects bucketName', () => {
      const hub = createBaseConfig({
        blob: { driver: 'cloudflare-r2', bucketName: 'test-bucket' }
      })
      expect(hasRemoteBindingId(hub)).toBe(true)
    })

    it('ignores blob: true without bucketName', () => {
      const hub = createBaseConfig({ blob: true })
      expect(hasRemoteBindingId(hub)).toBe(false)
    })

    it('ignores blob with other drivers', () => {
      const hub = createBaseConfig({
        blob: { driver: 'fs', dir: '/tmp/blob' }
      })
      expect(hasRemoteBindingId(hub)).toBe(false)
    })

    it('ignores bucketName without cloudflare-r2 driver', () => {
      const hub = createBaseConfig({
        blob: { bucketName: 'test-bucket' } as any
      })
      expect(hasRemoteBindingId(hub)).toBe(false)
    })
  })

  describe('multiple bindings', () => {
    it('detects when any binding ID is present', () => {
      const hub = createBaseConfig({
        db: { dialect: 'sqlite' }, // no databaseId
        kv: { namespaceId: 'test-kv-id' } // has namespaceId
      })
      expect(hasRemoteBindingId(hub)).toBe(true)
    })
  })
})
