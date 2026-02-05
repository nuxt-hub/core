import { defu } from 'defu'

import type { HubConfig, ResolvedKVConfig } from '@nuxthub/core'

/**
 * Resolve KV configuration from boolean or object format
 */
export function resolveKVConfig(hub: HubConfig): ResolvedKVConfig | false {
  if (!hub.kv) return false

  // If driver is already specified by user, use it with their options
  if (typeof hub.kv === 'object' && 'driver' in hub.kv) {
    if (hub.kv.driver === 'cloudflare-kv-binding') {
      return defu(hub.kv, { binding: 'KV' }) as ResolvedKVConfig
    }
    return hub.kv as ResolvedKVConfig
  }

  // Upstash Redis
  if ((process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)) {
    return defu(hub.kv, {
      driver: 'upstash',
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
    }) as ResolvedKVConfig
  }
  // Redis
  if (process.env.REDIS_URL || process.env.KV_URL?.startsWith('rediss://')) {
    return defu(hub.kv, {
      driver: 'redis',
      url: process.env.REDIS_URL || process.env.KV_URL
    }) as ResolvedKVConfig
  }
  // S3
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET && process.env.S3_REGION) {
    return defu(hub.kv, {
      driver: 's3',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined
    }) as ResolvedKVConfig
  }

  // Cloudflare KV
  if (hub.hosting.includes('cloudflare')) {
    return defu(hub.kv, {
      driver: 'cloudflare-kv-binding',
      binding: 'KV'
    }) as ResolvedKVConfig
  }

  // Deno KV
  if (hub.hosting.includes('deno')) {
    return defu(hub.kv, {
      driver: 'deno-kv'
    }) as ResolvedKVConfig
  }

  // Default: local file storage
  return defu(hub.kv, {
    driver: 'fs-lite',
    base: '.data/kv'
  }) as ResolvedKVConfig
}
