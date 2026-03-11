import { join } from 'pathe'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { defu } from 'defu'
import { addTypeTemplate, addServerImports, addImportsDir, logger } from '@nuxt/kit'

import type { Nuxt } from '@nuxt/schema'
import type { CloudflareR2BlobConfig, HubConfig, ResolvedBlobConfig, ResolvedS3BlobConfig, S3BlobConfig } from '@nuxthub/core'
import { resolve, logWhenReady, addWranglerBinding } from '../utils'

const log = logger.withTag('nuxt:hub')

const supportedDrivers = ['fs', 's3', 'vercel-blob', 'cloudflare-r2'] as const

function isBlobConfigObject(blob: HubConfig['blob']): blob is Exclude<HubConfig['blob'], boolean> {
  return typeof blob === 'object' && blob !== null
}

function resolveS3BlobConfig(blobConfig?: Partial<S3BlobConfig>): ResolvedS3BlobConfig {
  return {
    driver: 's3',
    accessKeyId: blobConfig?.accessKeyId || process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: blobConfig?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY || '',
    bucket: blobConfig?.bucket || process.env.S3_BUCKET || '',
    region: blobConfig?.region || process.env.S3_REGION || 'auto',
    endpoint: blobConfig?.endpoint || process.env.S3_ENDPOINT
  }
}

function isConfiguredS3BlobConfig(blobConfig: Pick<ResolvedS3BlobConfig, 'accessKeyId' | 'secretAccessKey' | 'bucket' | 'endpoint'>) {
  return Boolean(blobConfig.accessKeyId && blobConfig.secretAccessKey && (blobConfig.bucket || blobConfig.endpoint))
}

function shouldResolveBlobAtRuntime(nuxt: Nuxt, hub: HubConfig, blobInput: HubConfig['blob'], blobConfig: ResolvedBlobConfig) {
  if (nuxt.options.dev || hub.hosting.includes('cloudflare')) {
    return false
  }

  if (blobInput === true && blobConfig.driver === 'fs') {
    return 'auto' as const
  }

  if (isBlobConfigObject(blobInput) && blobInput.driver === 's3' && !isConfiguredS3BlobConfig(blobInput)) {
    return 's3' as const
  }

  return false
}

export function generateBlobContent(nuxt: Nuxt, hub: HubConfig, blobInput: HubConfig['blob'], blobConfig: ResolvedBlobConfig): string {
  const runtimeResolution = shouldResolveBlobAtRuntime(nuxt, hub, blobInput, blobConfig)

  if (runtimeResolution === 'auto') {
    return `import { createBlobStorage } from "@nuxthub/core/blob";

export { ensureBlob } from "@nuxthub/core/blob";

function resolveBlobConfig() {
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && (process.env.S3_BUCKET || process.env.S3_ENDPOINT)) {
    return {
      driver: "s3",
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET || "",
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      driver: "vercel-blob",
      access: "public"
    }
  }

  return ${JSON.stringify(blobConfig)}
}

const blobConfig = resolveBlobConfig()

const { createDriver } = await (async () => {
  if (blobConfig.driver === "s3") {
    return import("@nuxthub/core/blob/drivers/s3")
  }

  if (blobConfig.driver === "vercel-blob") {
    return import("@nuxthub/core/blob/drivers/vercel-blob")
  }

  return import("@nuxthub/core/blob/drivers/fs")
})()

const { driver, ...driverOptions } = blobConfig
export const blob = createBlobStorage(createDriver(driverOptions));
`
  }

  if (runtimeResolution === 's3') {
    const s3Config = blobInput as S3BlobConfig

    return `import { createBlobStorage } from "@nuxthub/core/blob";

export { ensureBlob } from "@nuxthub/core/blob";

const blobConfig = {
  driver: "s3",
  accessKeyId: ${JSON.stringify(s3Config.accessKeyId)} || process.env.S3_ACCESS_KEY_ID || "",
  secretAccessKey: ${JSON.stringify(s3Config.secretAccessKey)} || process.env.S3_SECRET_ACCESS_KEY || "",
  bucket: ${JSON.stringify(s3Config.bucket)} || process.env.S3_BUCKET || "",
  region: ${JSON.stringify(s3Config.region)} || process.env.S3_REGION || "auto",
  endpoint: ${JSON.stringify(s3Config.endpoint)} || process.env.S3_ENDPOINT
}

if (!blobConfig.accessKeyId || !blobConfig.secretAccessKey || (!blobConfig.bucket && !blobConfig.endpoint)) {
  throw new Error('[nuxt-hub] S3 blob driver requires \`accessKeyId\`, \`secretAccessKey\`, and \`bucket\` or \`endpoint\` options, or the matching S3_* environment variables.')
}

const { createDriver } = await import("@nuxthub/core/blob/drivers/s3")

export const blob = createBlobStorage(createDriver(blobConfig));
`
  }

  const { driver, bucketName: _bucketName, ...driverOptions } = blobConfig as CloudflareR2BlobConfig

  return `import { createBlobStorage } from "@nuxthub/core/blob";
import { createDriver } from "@nuxthub/core/blob/drivers/${driver}";

export { ensureBlob } from "@nuxthub/core/blob";
export const blob = createBlobStorage(createDriver(${JSON.stringify(driverOptions)}));
`
}

export function resolveBlobConfig(hub: HubConfig, deps: Record<string, string>): ResolvedBlobConfig | false {
  if (!hub.blob) return false

  if (isBlobConfigObject(hub.blob) && 'driver' in hub.blob) {
    if (hub.blob.driver === 's3') {
      if ((hub.blob.accessKeyId || process.env.S3_ACCESS_KEY_ID) && !deps['aws4fetch']) {
        log.error('Please run `npx nypm i aws4fetch` to use S3')
      }

      return resolveS3BlobConfig(hub.blob)
    }

    if (hub.blob.driver === 'vercel-blob') {
      if (!deps['@vercel/blob']) {
        log.error('Please run `npx nypm i @vercel/blob` to use Vercel Blob')
      }

      return defu(hub.blob, {
        access: 'public'
      }) as ResolvedBlobConfig
    }

    if (hub.blob.driver === 'cloudflare-r2') {
      return defu(hub.blob, {
        binding: 'BLOB'
      }) as ResolvedBlobConfig
    }

    if (hub.blob.driver === 'fs') {
      return defu(hub.blob, {
        dir: join(hub.dir, 'blob')
      }) as ResolvedBlobConfig
    }

    return hub.blob as ResolvedBlobConfig
  }

  const s3Config = resolveS3BlobConfig()
  if (isConfiguredS3BlobConfig(s3Config)) {
    if (!deps['aws4fetch']) {
      log.error('Please run `npx nypm i aws4fetch` to use S3')
    }

    return s3Config
  }

  if (hub.hosting.includes('vercel') || process.env.BLOB_READ_WRITE_TOKEN) {
    if (!deps['@vercel/blob']) {
      log.error('Please run `npx nypm i @vercel/blob` to use Vercel Blob')
    }

    return defu(hub.blob, {
      driver: 'vercel-blob',
      access: 'public'
    }) as ResolvedBlobConfig
  }

  if (hub.hosting.includes('cloudflare')) {
    return defu(hub.blob, {
      driver: 'cloudflare-r2',
      binding: 'BLOB'
    }) as ResolvedBlobConfig
  }

  return defu(hub.blob, {
    driver: 'fs',
    dir: join(hub.dir, 'blob')
  }) as ResolvedBlobConfig
}

export async function setupBlob(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  const blobInput = hub.blob
  hub.blob = resolveBlobConfig(hub, deps)
  if (!hub.blob) return

  const blobConfig = hub.blob as ResolvedBlobConfig
  const runtimeResolution = shouldResolveBlobAtRuntime(nuxt, hub, blobInput, blobConfig)

  if (blobConfig.driver === 'cloudflare-r2' && blobConfig.bucketName) {
    addWranglerBinding(nuxt, 'r2_buckets', { binding: blobConfig.binding || 'BLOB', bucket_name: blobConfig.bucketName })
  }

  addImportsDir(resolve('blob/runtime/app/composables'))

  const { driver } = blobConfig

  if (!supportedDrivers.includes(driver as any)) {
    log.error(`Unsupported blob driver: ${driver}. Supported drivers: ${supportedDrivers.join(', ')}`)
    return
  }

  const blobContent = generateBlobContent(nuxt, hub, blobInput, blobConfig)

  const physicalBlobDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'blob')
  await mkdir(physicalBlobDir, { recursive: true })

  await writeFile(join(physicalBlobDir, 'blob.mjs'), blobContent)

  await copyFile(
    resolve('blob/runtime/blob.d.ts'),
    join(physicalBlobDir, 'blob.d.ts')
  )

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
  await writeFile(join(physicalBlobDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  nuxt.options.alias!['hub:blob'] = '@nuxthub/blob'

  addServerImports({ name: 'blob', from: '@nuxthub/blob', meta: { description: `The Blob storage instance.` } })
  addServerImports({ name: 'ensureBlob', from: '@nuxthub/blob', meta: { description: `Ensure the blob is valid and meets the specified requirements.` } })

  addTypeTemplate({
    filename: 'hub/blob.d.ts',
    getContents: () => `declare module 'hub:blob' {
  export * from '@nuxthub/blob'
}`
  }, { nitro: true, nuxt: true })

  if (blobConfig.driver === 'vercel-blob' && runtimeResolution !== 'auto') {
    nuxt.options.runtimeConfig.public.hub ||= {}
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
    logWhenReady(nuxt, 'Files stored in Vercel Blob are public. Manually configure a different storage driver if storing sensitive files.', 'warn')
  }

  if (runtimeResolution === 'auto') {
    logWhenReady(nuxt, '`hub:blob` using runtime driver resolution')
    return
  }

  if (runtimeResolution === 's3') {
    logWhenReady(nuxt, '`hub:blob` using `s3` driver with runtime env resolution')
    return
  }

  logWhenReady(nuxt, `\`hub:blob\` using \`${blobConfig.driver}\` driver`)
}
