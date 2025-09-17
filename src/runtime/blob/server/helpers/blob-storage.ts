import type { Driver, Storage } from 'unstorage'
import type { BlobMultipartOptions, BlobMultipartUpload } from '@nuxthub/core'
import type { S3DriverOptions } from 'unstorage/drivers/s3'

export interface BlobStorage extends Storage {
  driverName: string
  createMultipartUpload: (pathname: string, options?: BlobMultipartOptions) => Promise<BlobMultipartUpload>
  resumeMultipartUpload: (pathname: string, uploadId: string) => Promise<BlobMultipartUpload>
}

export function blobStorage(storage: Storage, mountPoint: string): BlobStorage {
  const driver = storage.getMount(mountPoint).driver
  const multiPartDriver = getMultiPartDriver(driver)
  return {
    driverName: driver.name!,
    ...storage,
    createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
      return multiPartDriver.createMultipartUpload(pathname, options)
    },
    resumeMultipartUpload: async (pathname: string, uploadId: string) => {
      return multiPartDriver.resumeMultipartUpload(pathname, uploadId)
    }
  }
}

function getMultiPartDriver(driver: Driver) {
  if (driver.name === 's3') {
    const driverOptions = driver.options as S3DriverOptions
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./blob-s3').then(({ createMultipartUpload }) => {
          return createMultipartUpload(pathname, driverOptions, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./blob-s3').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(pathname, uploadId, driverOptions)
        })
      }
    }
  }

  if (driver.name === 'cloudflare-r2-binding') {
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./blob-cloudflare').then(({ createMultipartUpload }) => {
          return createMultipartUpload(driver.getInstance!(), pathname, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./blob-cloudflare').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(driver.getInstance!(), pathname, uploadId)
        })
      }
    }
  }
  if (driver.name === 'vercel-blob') {
    const token = driver.options?.token || process.env['BLOB_READ_WRITE_TOKEN']
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./blob-vercel').then(({ createMultipartUpload }) => {
          return createMultipartUpload(token, pathname, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./blob-vercel').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(token, pathname, uploadId)
        })
      }
    }
  }

  if (driver.name === 'fs') {
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./blob-fs').then(({ createMultipartUpload }) => {
          return createMultipartUpload(driver, pathname, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./blob-fs').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(driver, pathname, uploadId)
        })
      }
    }
  }

  throw new Error(`Unsupported driver: ${driver.name}`)
}
