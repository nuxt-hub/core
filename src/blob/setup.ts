import { join } from 'pathe'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { addTypeTemplate, addServerImports, addImportsDir, logger } from '@nuxt/kit'
import { resolveBlobConfig } from './resolve'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedBlobConfig, CloudflareR2BlobConfig } from '@nuxthub/core'
import { resolve, logWhenReady, addWranglerBinding } from '../utils'

const log = logger.withTag('nuxt:hub')

// Supported blob drivers
const supportedDrivers = ['fs', 's3', 'vercel-blob', 'cloudflare-r2'] as const

export async function setupBlob(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.blob = resolveBlobConfig(hub, deps, log)
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

  const physicalBlobDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'blob')
  await mkdir(physicalBlobDir, { recursive: true })

  // Write the blob.mjs file
  await writeFile(join(physicalBlobDir, 'blob.mjs'), blobContent)

  // Copy blob.d.ts for TypeScript support
  await copyFile(
    resolve('blob/runtime/blob.d.ts'),
    join(physicalBlobDir, 'blob.d.ts')
  )

  // Write package.json for the physical package
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

  // Add alias to map hub:blob to @nuxthub/blob
  nuxt.options.alias!['hub:blob'] = '@nuxthub/blob'

  addServerImports({ name: 'blob', from: '@nuxthub/blob', meta: { description: `The Blob storage instance.` } })
  addServerImports({ name: 'ensureBlob', from: '@nuxthub/blob', meta: { description: `Ensure the blob is valid and meets the specified requirements.` } })

  // Generate type declaration for hub:blob virtual module
  addTypeTemplate({
    filename: 'hub/blob.d.ts',
    getContents: () => `declare module 'hub:blob' {
  export * from '@nuxthub/blob'
}`
  }, { nitro: true, nuxt: true })

  // Set blob provider in runtime config for client-side composables
  if (blobConfig.driver === 'vercel-blob') {
    nuxt.options.runtimeConfig.public.hub ||= {}
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
    logWhenReady(nuxt, 'Files stored in Vercel Blob are public. Manually configure a different storage driver if storing sensitive files.', 'warn')
  }

  logWhenReady(nuxt, `\`hub:blob\` using \`${blobConfig.driver}\` driver`)
}
