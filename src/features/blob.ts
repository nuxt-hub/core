import { join } from 'pathe'
import { defu } from 'defu'
import { createResolver, addServerScanDir, addServerImportsDir, addImportsDir, logger } from '@nuxt/kit'
import { logWhenReady } from '../features'

import type { Nuxt } from '@nuxt/schema'
import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'

import { ensureDependencyInstalled } from 'nypm'

const log = logger.withTag('nuxt:hub')
const { resolve } = createResolver(import.meta.url)

export function setupBlob(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro.devStorage ||= {}
  nuxt.options.nitro.devStorage.blob = defu(nuxt.options.nitro.devStorage.blob, {
    driver: 'fs-lite',
    base: join(hub.dir!, 'blob')
  })

  // Add Server scanning
  addServerScanDir(resolve('../runtime/blob/server'))
  addServerImportsDir(resolve('../runtime/blob/server/utils'))

  // Add Composables
  addImportsDir(resolve('../runtime/blob/app/composables'))

  if (nuxt.options.nitro.storage?.blob?.driver === 'vercel-blob') {
    nuxt.options.runtimeConfig.public.hub.blobProvider = 'vercel-blob'
  }

  const driver = nuxt.options.dev ? nuxt.options.nitro.devStorage.blob.driver : nuxt.options.nitro.storage?.blob?.driver

  logWhenReady(nuxt, `\`hubBlob()\` configured with \`${driver}\` driver`)
}

export async function setupProductionBlob(nitro: Nitro, _hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if blob driver is not already set
  if (nitro.options.storage?.blob?.driver) {
    log.info(`Using user-configured \`${nitro.options.storage.blob.driver}\` blob driver`)
    return
  }
  let kvConfig: NitroOptions['storage']['blob']

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets

    case 'vercel': {
      kvConfig = {
        driver: 'vercel-blob',
        access: 'public'
      }
      log.warn('Files stored in Vercel Blob are always public. Specify a different storage driver if storing sensitive files.')
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      kvConfig = {
        driver: 'cloudflare-r2-binding',
        bindingName: 'BLOB'
      }
      log.info('Ensure a `BLOB` binding is set in your Cloudflare Workers configuration')
      break
    }

    case 'netlify': {
      kvConfig = {
        driver: 'netlify-blobs',
        name: process.env.NETLIFY_BLOB_STORE_NAME
      }
      if (!process.env.NETLIFY_BLOB_STORE_NAME) {
        log.info('Set `NETLIFY_BLOB_STORE_NAME` environment variable to configure Netlify Blob storage')
      }
      break
    }
    case 'azure':
    case 'azure-functions': {
      kvConfig = {
        driver: 'azure-storage-blob',
        accountName: process.env.AZURE_BLOB_ACCOUNT_NAME
      }
      if (!process.env.AZURE_BLOB_ACCOUNT_NAME) {
        log.info('Set `AZURE_BLOB_ACCOUNT_NAME` environment variable to configure Azure Blob storage')
      }
      break
    }

    case 'aws-lambda':
    case 'aws-amplify': {
      kvConfig = {
        driver: 's3',
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        endpoint: process.env.S3_ENDPOINT,
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION
      }
      if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !process.env.S3_BUCKET) {
        log.info('Set `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_BUCKET` environment variables to configure S3 storage')
      }
      break
    }

    case 'digital-ocean': {
      kvConfig = {
        driver: 's3',
        accessKeyId: process.env.SPACES_KEY,
        secretAccessKey: process.env.SPACES_SECRET,
        endpoint: `${process.env.SPACES_REGION}.digitaloceanspaces.com`,
        bucket: process.env.SPACES_BUCKET,
        region: 'us-east-1'
      }
      if (!process.env.SPACES_KEY || !process.env.SPACES_SECRET || !process.env.SPACES_BUCKET || !process.env.SPACES_REGION) {
        log.info('Set `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, and `SPACES_REGION` environment variables to configure DigitalOcean Spaces storage')
      }
      break
    }

    default: {
      kvConfig = {
        driver: 'fs-lite',
        base: '.data/blob'
      }
      break
    }
  }

  if (kvConfig) {
    // check if driver dependencies are installed
    switch (kvConfig.driver) {
      case 'vercel-blob':
        await ensureDependencyInstalled('@vercel/blob')
        break
      case 's3':
        await ensureDependencyInstalled('aws4fetch')
        break
      case 'netlify-blobs':
        await ensureDependencyInstalled('@netlify/blobs')
        break
      case 'azure-storage-blob':
        await ensureDependencyInstalled('@azure/storage-blob')
        await ensureDependencyInstalled('@azure/identity')
        break
    }

    // set driver
    nitro.options.storage ||= {}
    nitro.options.storage.blob = defu(nitro.options.storage?.blob, kvConfig)
    log.info(`Using zero-config \`${kvConfig.driver}\` blob driver`)
  }
}
