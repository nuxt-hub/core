import { defu } from 'defu'
import type { Unstable_Config } from 'wrangler'
import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../features'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'pathe'

export async function isCloudflareDev(nuxt: Nuxt, deps: Record<string, string>): Promise<boolean> {
  if (!nuxt.options.nitro.preset?.includes('cloudflare')) return false

  const compatibilityDate = nuxt.options.nitro.compatibilityDate

  let dateToCheck: string | undefined
  if (typeof compatibilityDate === 'string') {
    dateToCheck = compatibilityDate
  } else if (typeof compatibilityDate === 'object' && compatibilityDate !== null) {
    dateToCheck = (compatibilityDate as any).cloudflare ?? (compatibilityDate as any).default
  }

  if (dateToCheck && dateToCheck !== 'latest' && new Date(dateToCheck) < new Date('2025-07-13')) {
    return false
  }

  if (!deps.wrangler) {
    return false
  }

  return true
}

export async function generateWranglerFile(nuxt: Nuxt, hub: HubConfig) {
  const wrangler: Partial<Unstable_Config> = {}
  const name = 'hub'

  if (hub.ai === 'cloudflare') {
    wrangler['ai'] = {
      binding: 'AI'
    }
  }

  if (hub.blob) {
    wrangler['r2_buckets'] = [{
      binding: 'BLOB',
      bucket_name: name
    }]
  }

  if (hub.cache || hub.kv) {
    wrangler['kv_namespaces'] = []

    if (hub.cache) {
      wrangler['kv_namespaces'].push({
        binding: 'CACHE',
        id: `cache_${name}`
      })
    }

    if (hub.kv) {
      wrangler['kv_namespaces'].push({
        binding: 'KV',
        id: `kv_${name}`
      })
    }
  }

  if (hub.database === 'sqlite') {
    wrangler['d1_databases'] = [{
      binding: 'DB',
      database_name: name,
      database_id: name
    }]
  }

  if (hub.database === 'postgresql') {
    wrangler['hyperdrive'] = [{
      id: `hyperdrive_${name}`,
      binding: 'HYPERDRIVE',
      localConnectionString: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
    }]
  }

  // Create the .data/hub directory
  await mkdir(join(nuxt.options.rootDir, hub.dir!), { recursive: true })

  const mergedWrangler = defu(wrangler, nuxt.options.nitro.cloudflare?.wrangler)
  await writeFile(join(nuxt.options.rootDir, hub.dir!, 'wrangler.jsonc'), JSON.stringify(mergedWrangler, null, 2), 'utf-8')
}
