import type { Driver } from 'unstorage'
import type { S3DriverOptions } from 'unstorage/drivers/s3'
import type { BlobMultipartOptions } from '../../types'

export function getMultiPartDriver(driver: Driver) {
  if (driver.name === 's3') {
    const driverOptions = driver.options as S3DriverOptions
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./s3').then(({ createMultipartUpload }) => {
          return createMultipartUpload(pathname, driverOptions, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./s3').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(pathname, uploadId, driverOptions)
        })
      }
    }
  }

  if (driver.name === 'cloudflare-r2-binding') {
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./cloudflare').then(({ createMultipartUpload }) => {
          return createMultipartUpload(driver.getInstance!(), pathname, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./cloudflare').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(driver.getInstance!(), pathname, uploadId)
        })
      }
    }
  }
  if (driver.name === 'vercel-blob') {
    const token = driver.options?.token || process.env['BLOB_READ_WRITE_TOKEN']
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./vercel').then(({ createMultipartUpload }) => {
          return createMultipartUpload(token, pathname, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./vercel').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(token, pathname, uploadId)
        })
      }
    }
  }

  if (driver.name && ['fs', 'fs-lite'].includes(driver.name)) {
    return {
      createMultipartUpload: async (pathname: string, options?: BlobMultipartOptions) => {
        return await import('./fs').then(({ createMultipartUpload }) => {
          return createMultipartUpload(driver, pathname, options)
        })
      },
      resumeMultipartUpload: async (pathname: string, uploadId: string) => {
        return await import('./fs').then(({ resumeMultipartUpload }) => {
          return resumeMultipartUpload(driver, pathname, uploadId)
        })
      }
    }
  }

  throw new Error(`Unsupported driver: ${driver.name}`)
}
