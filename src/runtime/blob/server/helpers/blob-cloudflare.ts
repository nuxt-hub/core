import mime from 'mime'
import type { R2Bucket, R2Object } from '@cloudflare/workers-types/experimental'
import type { BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobUploadedPart } from '@nuxthub/core'

export async function createMultipartUpload(bucket: R2Bucket, pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
  const mpu = await bucket.createMultipartUpload(pathname!, {
    httpMetadata: {
      contentType: options?.contentType || 'application/octet-stream'
    },
    customMetadata: options?.customMetadata || {}
  })
  return {
    pathname,
    uploadId: mpu.uploadId,
    uploadPart(partNumber, value) {
      return mpu.uploadPart(partNumber, value as any) as Promise<BlobUploadedPart>
    },
    abort: async () => {
      await mpu.abort()
    },
    complete: async (uploadedParts) => {
      const r2Object = await mpu.complete(uploadedParts)
      return mapR2ObjectToBlob(r2Object)
    }
  }
}
export async function resumeMultipartUpload(bucket: R2Bucket, pathname: string, uploadId: string): Promise<BlobMultipartUpload> {
  const mpu = bucket.resumeMultipartUpload(pathname!, uploadId)
  return {
    pathname,
    uploadId: mpu.uploadId,
    uploadPart(partNumber, value) {
      return mpu.uploadPart(partNumber, value as any) as Promise<BlobUploadedPart>
    },
    abort: async () => {
      await mpu.abort()
    },
    complete: async (uploadedParts) => {
      const r2Object = await mpu.complete(uploadedParts)
      return mapR2ObjectToBlob(r2Object)
    }
  }
}

function getContentType(pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
}

function mapR2ObjectToBlob(object: R2Object): BlobObject {
  return {
    pathname: object.key,
    contentType: object.httpMetadata?.contentType || getContentType(object.key),
    size: object.size,
    httpEtag: object.httpEtag,
    uploadedAt: object.uploaded,
    httpMetadata: object.httpMetadata || {},
    customMetadata: object.customMetadata || {}
  }
}
