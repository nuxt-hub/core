import type { R2Bucket, R2Object, R2ListOptions } from '@cloudflare/workers-types/experimental'
import type { BlobDriver, BlobPutBody } from './types'
import type { BlobListOptions, BlobListResult, BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobPutOptions, BlobUploadedPart } from '../../types'
import { getContentType } from '../utils'

export interface CloudflareDriverOptions {
  binding: string
}

function mapR2ObjectToBlob(object: R2Object): BlobObject {
  return {
    pathname: object.key,
    contentType: object.httpMetadata?.contentType || getContentType(object.key),
    size: object.size,
    httpEtag: object.httpEtag,
    uploadedAt: object.uploaded,
    httpMetadata: (object.httpMetadata || {}) as Record<string, string>,
    customMetadata: object.customMetadata || {}
  }
}

export function createDriver(options: CloudflareDriverOptions): BlobDriver<CloudflareDriverOptions> {
  const getBucket = (): R2Bucket => {
    const binding = options.binding || 'BLOB'
    // @ts-expect-error globalThis may have the binding
    const bucket = globalThis[binding] || globalThis.__env__?.[binding] || process.env[binding]
    if (!bucket) {
      throw new Error(`R2 binding "${options.binding}" not found`)
    }
    return bucket
  }

  return {
    name: 'cloudflare-r2',
    options,

    async list(listOptions?: BlobListOptions): Promise<BlobListResult> {
      const bucket = getBucket()
      const r2Options: R2ListOptions = {
        limit: listOptions?.limit ?? 1000,
        prefix: listOptions?.prefix,
        cursor: listOptions?.cursor,
        delimiter: listOptions?.folded ? '/' : undefined,
        include: ['httpMetadata', 'customMetadata']
      }

      const result = await bucket.list(r2Options)

      const blobs: BlobObject[] = result.objects.map(mapR2ObjectToBlob)

      return {
        blobs,
        hasMore: result.truncated,
        cursor: result.truncated ? result.cursor : undefined,
        folders: listOptions?.folded ? result.delimitedPrefixes : undefined
      }
    },

    async get(pathname: string): Promise<Blob | null> {
      const bucket = getBucket()
      const object = await bucket.get(decodeURIComponent(pathname))

      if (!object) {
        return null
      }

      const arrayBuffer = await object.arrayBuffer()
      return new Blob([arrayBuffer], {
        type: object.httpMetadata?.contentType || getContentType(pathname)
      })
    },

    async getArrayBuffer(pathname: string): Promise<ArrayBuffer | null> {
      const bucket = getBucket()
      const object = await bucket.get(decodeURIComponent(pathname))

      if (!object) {
        return null
      }

      return object.arrayBuffer()
    },

    async put(pathname: string, body: BlobPutBody, options?: BlobPutOptions): Promise<BlobObject> {
      const bucket = getBucket()

      const contentType = options?.contentType || (body instanceof Blob ? body.type : undefined) || getContentType(pathname)

      if (options?.access) {
        console.warn('Setting access level for blob in Cloudflare R2 is not supported, it will be ignored')
      }
      const r2Object = await bucket.put(pathname, body as any, {
        httpMetadata: {
          contentType
        },
        customMetadata: options?.customMetadata
      })

      return mapR2ObjectToBlob(r2Object)
    },

    async head(pathname: string): Promise<BlobObject | null> {
      const bucket = getBucket()
      const object = await bucket.head(decodeURIComponent(pathname))

      if (!object) {
        return null
      }

      return mapR2ObjectToBlob(object)
    },

    async hasItem(pathname: string): Promise<boolean> {
      const bucket = getBucket()
      const object = await bucket.head(decodeURIComponent(pathname))
      return object !== null
    },

    async delete(pathnames: string | string[]): Promise<void> {
      const bucket = getBucket()
      const paths = Array.isArray(pathnames) ? pathnames : [pathnames]

      await Promise.all(
        paths.map(p => bucket.delete(decodeURIComponent(p)))
      )
    },

    async createMultipartUpload(pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
      const bucket = getBucket()
      const mpu = await bucket.createMultipartUpload(pathname, {
        httpMetadata: {
          contentType: options?.contentType || getContentType(pathname)
        },
        customMetadata: options?.customMetadata || {}
      })

      return {
        pathname,
        uploadId: mpu.uploadId,
        uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
          return mpu.uploadPart(partNumber, value as any) as Promise<BlobUploadedPart>
        },
        async abort(): Promise<void> {
          await mpu.abort()
        },
        async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
          const r2Object = await mpu.complete(uploadedParts)
          return mapR2ObjectToBlob(r2Object)
        }
      }
    },

    async resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload> {
      const bucket = getBucket()
      const mpu = bucket.resumeMultipartUpload(pathname, uploadId)

      return {
        pathname,
        uploadId: mpu.uploadId,
        uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
          return mpu.uploadPart(partNumber, value as any) as Promise<BlobUploadedPart>
        },
        async abort(): Promise<void> {
          await mpu.abort()
        },
        async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
          const r2Object = await mpu.complete(uploadedParts)
          return mapR2ObjectToBlob(r2Object)
        }
      }
    }
  }
}
