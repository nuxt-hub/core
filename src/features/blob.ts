import { join } from 'pathe'
import { defu } from 'defu'
import { addServerScanDir, addServerImportsDir, addImportsDir, logger } from '@nuxt/kit'
import { logWhenReady } from '../features'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, BlobConfig, ResolvedBlobConfig } from '../types'
import { resolve } from '../module'

const log = logger.withTag('nuxt:hub')

/**
 * Resolve blob configuration from boolean or object format
 */
export function resolveBlobConfig(hub: HubConfig, deps: Record<string, string>): ResolvedBlobConfig | false {
  if (!hub.blob) return false

  // Start with user-provided config if it's an object
  const userConfig = typeof hub.blob === 'object' ? hub.blob : {} as BlobConfig

  // If driver is already specified by user, use it with their options
  if (userConfig.driver) {
    return userConfig as ResolvedBlobConfig
  }

  // AWS S3
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET && process.env.S3_REGION) {
    if (!deps['aws4fetch']) {
      log.error('Please run `npx nypm i aws4fetch` to use S3')
    }
    return defu(userConfig, {
      driver: 's3',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT
    }) as ResolvedBlobConfig
  }

  // Vercel Blob
  if (hub.hosting.includes('vercel')) {
    if (!deps['@vercel/blob']) {
      log.error('Please run `npx nypm i @vercel/blob` to use Vercel Blob')
    }
    return defu(userConfig, {
      driver: 'vercel-blob',
      access: 'public'
    }) as ResolvedBlobConfig
  }

  // Cloudflare R2
  if (hub.hosting.includes('cloudflare')) {
    return defu(userConfig, {
      driver: 'cloudflare-r2-binding',
      binding: 'BLOB'
    }) as ResolvedBlobConfig
  }

  // Netlify Blobs
  if (hub.hosting.includes('netlify')) {
    if (!deps['@netlify/blobs']) {
      log.error('Please run `npx nypm i @netlify/blobs` to use Netlify Blobs')
    }
    return defu(userConfig, {
      driver: 'netlify-blobs',
      name: process.env.NETLIFY_BLOB_STORE_NAME
    }) as ResolvedBlobConfig
  }

  // Default: file system storage
  return defu(userConfig, {
    driver: 'fs-lite',
    base: join(hub.dir!, 'blob')
  }) as ResolvedBlobConfig
}

export function setupBlob(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.blob = resolveBlobConfig(hub, deps)
  if (!hub.blob) return

  const blobConfig = hub.blob as BlobConfig

  // Configure storage
  nuxt.options.nitro.storage ||= {}
  nuxt.options.nitro.storage.blob = defu(nuxt.options.nitro.storage.blob, blobConfig)

  // Add Server scanning
  addServerScanDir(resolve('runtime/blob/server'))
  addServerImportsDir(resolve('runtime/blob/server/utils'))

  // Add Composables
  addImportsDir(resolve('runtime/blob/app/composables'))

  // Add alias for hub:blob import
  nuxt.options.nitro.alias ||= {}
  nuxt.options.nitro.alias['hub:blob'] = resolve('runtime/blob/server/utils/blob.ts')

  // Set blob provider in runtime config for client-side composables
  if (blobConfig.driver === 'vercel-blob') {
    nuxt.options.runtimeConfig.public.hub ||= {}
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
    logWhenReady(nuxt, 'Files stored in Vercel Blob are public. Manually configure a different storage driver if storing sensitive files.', 'warn')
  }

  logWhenReady(nuxt, `\`hub:blob\` using \`${blobConfig.driver}\` driver`)
}
