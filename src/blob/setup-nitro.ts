import { join } from 'pathe'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import type { Nitro } from 'nitropack/types'
import type { HubConfig, ResolvedBlobConfig, CloudflareR2BlobConfig } from '@nuxthub/core'
import { resolveBlobConfig } from './setup'
import { resolve, addWranglerBindingNitro } from '../utils-nitro'

const supportedDrivers = ['fs', 's3', 'vercel-blob', 'cloudflare-r2'] as const

export async function setupBlobNitro(nitro: Nitro, hub: HubConfig, deps: Record<string, string>) {
  hub.blob = resolveBlobConfig(hub, deps)
  if (!hub.blob) return

  const blobConfig = hub.blob as ResolvedBlobConfig
  const log = nitro.logger.withTag('nitro:hub')

  if (blobConfig.driver === 'cloudflare-r2' && blobConfig.bucketName) {
    addWranglerBindingNitro(nitro, 'r2_buckets', { binding: blobConfig.binding || 'BLOB', bucket_name: blobConfig.bucketName })
  }

  const { driver, bucketName: _bucketName, ...driverOptions } = blobConfig as CloudflareR2BlobConfig

  if (!supportedDrivers.includes(driver as any)) {
    log.error(`Unsupported blob driver: ${driver}. Supported drivers: ${supportedDrivers.join(', ')}`)
    return
  }

  const blobContent = `import { createBlobStorage } from "@nuxthub/core/blob";
import { createDriver } from "@nuxthub/core/blob/drivers/${driver}";

export { ensureBlob } from "@nuxthub/core/blob";
export const blob = createBlobStorage(createDriver(${JSON.stringify(driverOptions)}));
`

  const physicalBlobDir = join(nitro.options.rootDir, 'node_modules', '@nuxthub', 'blob')
  await mkdir(physicalBlobDir, { recursive: true })
  await writeFile(join(physicalBlobDir, 'blob.mjs'), blobContent)
  await copyFile(resolve('blob/runtime/blob.d.ts'), join(physicalBlobDir, 'blob.d.ts'))

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

  nitro.options.alias ||= {}
  nitro.options.alias['hub:blob'] = '@nuxthub/blob'

  if (nitro.options.imports !== false) {
    nitro.options.imports = nitro.options.imports || {}
    nitro.options.imports.presets ??= []
    nitro.options.imports.presets.push({ from: '@nuxthub/blob', imports: ['blob', 'ensureBlob'] })
  }

  nitro.hooks.hook('types:extend', async (types) => {
    const dtsContents = `declare module 'hub:blob' {\n  export * from '@nuxthub/blob'\n}\n`
    const dtsPath = join(nitro.options.buildDir, 'types/hub-blob.d.ts')
    await mkdir(join(nitro.options.buildDir, 'types'), { recursive: true })
    await writeFile(dtsPath, dtsContents)
    if (types.tsConfig) {
      types.tsConfig.include = types.tsConfig.include || []
      types.tsConfig.include.push(dtsPath)
    }
  })

  log.info(`\`hub:blob\` using \`${blobConfig.driver}\` driver`)
}
