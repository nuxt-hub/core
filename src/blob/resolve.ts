import { join } from 'pathe'
import { defu } from 'defu'

import type { HubConfig, ResolvedBlobConfig } from '@nuxthub/core'

type HubLogger = { error: (message: string) => void }

/**
 * Resolve blob configuration from boolean or object format
 */
export function resolveBlobConfig(hub: HubConfig, deps: Record<string, string>, log?: HubLogger): ResolvedBlobConfig | false {
  if (!hub.blob) return false

  // If driver is already specified by user, use it with their options
  if (typeof hub.blob === 'object' && 'driver' in hub.blob) {
    return hub.blob as ResolvedBlobConfig
  }

  const logError = log?.error?.bind(log)

  // AWS S3
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && (process.env.S3_BUCKET || process.env.S3_ENDPOINT)) {
    if (!deps['aws4fetch']) {
      logError?.('Please run `npx nypm i aws4fetch` to use S3')
    }
    return defu(hub.blob, {
      driver: 's3',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT
    }) as ResolvedBlobConfig
  }

  // Vercel Blob
  if (hub.hosting.includes('vercel') || process.env.BLOB_READ_WRITE_TOKEN) {
    if (!deps['@vercel/blob']) {
      logError?.('Please run `npx nypm i @vercel/blob` to use Vercel Blob')
    }
    return defu(hub.blob, {
      driver: 'vercel-blob',
      access: 'public'
    }) as ResolvedBlobConfig
  }

  // Cloudflare R2
  if (hub.hosting.includes('cloudflare')) {
    return defu(hub.blob, {
      driver: 'cloudflare-r2',
      binding: 'BLOB'
    }) as ResolvedBlobConfig
  }

  // Default: file system storage
  return defu(hub.blob, {
    driver: 'fs',
    dir: join(hub.dir, 'blob')
  }) as ResolvedBlobConfig
}
