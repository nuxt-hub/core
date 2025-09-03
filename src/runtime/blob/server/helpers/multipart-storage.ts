import type { Driver, Storage } from 'unstorage'
import type { BlobMultipartOptions } from '@nuxthub/core'

export function multiPartBlobStorage(storage: Storage, mountPoint: string) {
  const driver = getMultiPartDriver(storage.getMount(mountPoint).driver)
  return {
    ...storage,
    createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
      return driver.createMultipartUpload(pathname, options)
    },
    resumeMultipartUpload: async (pathname: string, uploadId: string) => {
      return driver.resumeMultipartUpload(pathname, uploadId)
    }
  }
}

function getMultiPartDriver(driver: Driver) {
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
