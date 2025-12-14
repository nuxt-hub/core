import { join } from 'pathe'
import { defu } from 'defu'
import { addTypeTemplate, addServerImports, addImportsDir, logger, addTemplate } from '@nuxt/kit'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedBlobConfig, CloudflareR2BlobConfig } from '@nuxthub/core'
import { resolve, logWhenReady, addWranglerBinding } from '../utils'

const log = logger.withTag('nuxt:hub')

// Supported blob drivers
const supportedDrivers = ['fs', 's3', 'vercel-blob', 'cloudflare-r2'] as const

/**
 * Resolve blob configuration from boolean or object format
 */
export function resolveBlobConfig(hub: HubConfig, deps: Record<string, string>): ResolvedBlobConfig | false {
  if (!hub.blob) return false

  // If driver is already specified by user, use it with their options
  if (typeof hub.blob === 'object' && 'driver' in hub.blob) {
    return hub.blob as ResolvedBlobConfig
  }

  // Otherwise hub.blob is set to true, so we need to resolve the config
  // AWS S3
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && (process.env.S3_BUCKET || process.env.S3_ENDPOINT)) {
    if (!deps['aws4fetch']) {
      log.error('Please run `npx nypm i aws4fetch` to use S3')
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
      log.error('Please run `npx nypm i @vercel/blob` to use Vercel Blob')
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

export function setupBlob(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.blob = resolveBlobConfig(hub, deps)
  if (!hub.blob) return

  const blobConfig = hub.blob as ResolvedBlobConfig

  if (blobConfig.driver === 'cloudflare-r2' && blobConfig.bucketName) {
    addWranglerBinding(nuxt, 'r2_buckets', { binding: blobConfig.binding || 'BLOB', bucket_name: blobConfig.bucketName })
  }

  // Add Composables
  addImportsDir(resolve('blob/runtime/app/composables'))

  const { driver, bucketName: _bucketName, ...driverOptions } = blobConfig as CloudflareR2BlobConfig

  if (!supportedDrivers.includes(driver as any)) {
    log.error(`Unsupported blob driver: ${driver}. Supported drivers: ${supportedDrivers.join(', ')}`)
    return
  }

  const template = addTemplate({
    filename: 'hub/blob.mjs',
    getContents: () => `import { createBlobStorage } from "@nuxthub/core/blob";
import { createDriver } from "@nuxthub/core/blob/drivers/${driver}";

export { ensureBlob } from "@nuxthub/core/blob";
export const blob = createBlobStorage(createDriver(${JSON.stringify(driverOptions)}));
`,
    write: true
  })

  addServerImports({ name: 'blob', from: 'hub:blob', meta: { description: `The Blob storage instance.` } })
  addServerImports({ name: 'ensureBlob', from: 'hub:blob', meta: { description: `Ensure the blob is valid and meets the specified requirements.` } })
  addTypeTemplate({
    src: resolve('blob/runtime/blob.d.ts'),
    filename: 'hub/blob.d.ts'
  }, { nitro: true, nuxt: true })
  // Add alias for hub:blob import
  nuxt.options.alias['hub:blob'] = template.dst

  // Set blob provider in runtime config for client-side composables
  if (blobConfig.driver === 'vercel-blob') {
    nuxt.options.runtimeConfig.public.hub ||= {}
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
    logWhenReady(nuxt, 'Files stored in Vercel Blob are public. Manually configure a different storage driver if storing sensitive files.', 'warn')
  }

  logWhenReady(nuxt, `\`hub:blob\` using \`${blobConfig.driver}\` driver`)
}
