import { join } from 'pathe'
import { createHash } from 'node:crypto'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { defu } from 'defu'
import { addTemplate, addTypeTemplate, addServerImports, addImportsDir, logger } from '@nuxt/kit'

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

export async function setupBlob(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
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

  // Generate physical @nuxthub/blob package for external bundlers (like Workflow)
  const blobContent = `import { createBlobStorage } from "@nuxthub/core/blob";
import { createDriver } from "@nuxthub/core/blob/drivers/${driver}";

export { ensureBlob } from "@nuxthub/core/blob";
export const blob = createBlobStorage(createDriver(${JSON.stringify(driverOptions)}));
`

  const blobHash = createHash('sha256').update(blobContent).digest('hex').slice(0, 12)
  const blobShimTemplate = addTemplate({
    filename: `hub/blob.${blobHash}.mjs`,
    write: true,
    getContents: () => blobContent
  })

  // Avoid relying on a physical package during dev/typecheck; keep this import working in Nuxt.
  nuxt.options.alias!['@nuxthub/blob'] = blobShimTemplate.dst
  nuxt.options.alias!['hub:blob'] = blobShimTemplate.dst

  addServerImports({ name: 'blob', from: '@nuxthub/blob', meta: { description: `The Blob storage instance.` } })
  addServerImports({ name: 'ensureBlob', from: '@nuxthub/blob', meta: { description: `Ensure the blob is valid and meets the specified requirements.` } })

  // Generate type declarations for both `@nuxthub/blob` and `hub:blob`.
  addTypeTemplate({
    filename: 'hub/blob.d.ts',
    getContents: () => `import type { BlobStorage } from '@nuxthub/core/blob'

declare module '@nuxthub/blob' {
  export const blob: BlobStorage
  export { ensureBlob } from '@nuxthub/core/blob'
}

declare module 'hub:blob' {
  export * from '@nuxthub/blob'
}
`
  }, { nitro: true, nuxt: true })

  const packageJson = {
    name: '@nuxthub/blob',
    version: '0.0.0',
    type: 'module',
    exports: {
      '.': {
        types: './blob.d.ts',
        default: './blob.mjs'
      }
    }
  }

  // Only materialize a physical package during build. Avoid mutating `node_modules/` for `nuxt typecheck`.
  nuxt.hook('nitro:build:before', async () => {
    const physicalBlobDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'blob')
    await mkdir(physicalBlobDir, { recursive: true })

    await writeFile(join(physicalBlobDir, 'blob.mjs'), blobContent)
    await copyFile(
      resolve('blob/runtime/blob.d.ts'),
      join(physicalBlobDir, 'blob.d.ts')
    )
    await writeFile(join(physicalBlobDir, 'package.json'), JSON.stringify(packageJson, null, 2))
  })

  // Set blob provider in runtime config for client-side composables
  if (blobConfig.driver === 'vercel-blob') {
    nuxt.options.runtimeConfig.public.hub ||= {}
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
    logWhenReady(nuxt, 'Files stored in Vercel Blob are public. Manually configure a different storage driver if storing sensitive files.', 'warn')
  }

  logWhenReady(nuxt, `\`hub:blob\` using \`${blobConfig.driver}\` driver`)
}
