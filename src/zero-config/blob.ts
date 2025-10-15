import { logger } from '@nuxt/kit'
import { defu } from 'defu'

import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function configureProductionBlobDriver(nitro: Nitro, _hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if blob driver is not already set
  if (nitro.options.storage?.blob?.driver) {
    log.info(`Using user-configured \`${nitro.options.storage.blob.driver}\` blob driver`)
    return
  }
  let blobConfig: NitroOptions['storage']['blob']

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets
    case 'vercel': {
      blobConfig = {
        driver: 'vercel-blob',
        access: 'public'
      }
      log.warn('Files stored in Vercel Blob are always public. Specify a different storage driver if storing sensitive files.')
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      blobConfig = {
        driver: 'cloudflare-r2-binding',
        bindingName: 'BLOB'
      }
      log.info('Ensure a `BLOB` binding is set in your Cloudflare Workers configuration')
      break
    }

    case 'netlify': {
      blobConfig = {
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
      blobConfig = {
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
      blobConfig = {
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
      blobConfig = {
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
      blobConfig = {
        driver: 'fs-lite',
        base: '.data/blob'
      }
      break
    }
  }

  if (blobConfig) {
    // check if driver dependencies are installed
    if (blobConfig.driver === 'vercel-blob' && !deps['@vercel/blob']) {
      throw new Error('Please run `npx nypm i @vercel/blob` to use Vercel Blob')
    } else if (blobConfig.driver === 's3' && !deps['aws4fetch']) {
      throw new Error('Please run `npx nypm i aws4fetch` to use S3')
    } else if (blobConfig.driver === 'netlify-blobs' && !deps['@netlify/blobs']) {
      throw new Error('Please run `npx nypm i @netlify/blobs` to use Netlify Blobs')
    } else if (blobConfig.driver === 'azure-storage-blob' && (!deps['@azure/storage-blob'] || !deps['@azure/identity'])) {
      throw new Error('Please run `npx nypm i @azure/storage-blob @azure/identity` to use Azure Blob Storage')
    }

    // set driver
    nitro.options.storage ||= {}
    nitro.options.storage.blob = defu(nitro.options.storage?.blob, blobConfig)
    log.info(`Using zero-config \`${blobConfig.driver}\` blob driver`)
  }
}
