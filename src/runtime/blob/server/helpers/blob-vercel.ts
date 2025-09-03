import type { PutBlobResult } from '@vercel/blob'
import { createMultipartUpload as vercelCreateMultipartUpload, uploadPart as vercelUploadPart, completeMultipartUpload as vercelCompleteMultipartUpload } from '@vercel/blob'
import type { BlobMultipartOptions, BlobMultipartUpload, BlobObject } from '@nuxthub/core'

export async function createMultipartUpload(token: string, pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
  const { key, uploadId } = await vercelCreateMultipartUpload(pathname, {
    access: 'public',
    token,
    contentType: options?.contentType || 'application/octet-stream'
  })
  return {
    pathname,
    uploadId: uploadId,
    uploadPart(partNumber, value) {
      return vercelUploadPart(pathname, value as any, {
        access: 'public',
        token,
        contentType: options?.contentType || 'application/octet-stream',
        uploadId,
        key,
        partNumber
      })
    },
    abort: async () => {
      // await mpu.abort()
    },
    complete: async (uploadedParts) => {
      const r2Object = await vercelCompleteMultipartUpload(pathname, uploadedParts, {
        access: 'public',
        token,
        contentType: options?.contentType || 'application/octet-stream',
        uploadId,
        key
      })
      return mapR2ObjectToBlob(r2Object)
    }
  }
}
export async function resumeMultipartUpload(token: string, pathname: string, uploadId: string): Promise<BlobMultipartUpload> {
  return {
    pathname,
    uploadId: uploadId,
    uploadPart(partNumber, value) {
      return vercelUploadPart(pathname, value as any, {
        access: 'public',
        token,
        uploadId,
        partNumber,
        key: pathname
      })
    },
    abort: async () => {
      // await mpu.abort()
    },
    complete: async (uploadedParts) => {
      const putBlobResult = await vercelCompleteMultipartUpload(pathname, uploadedParts, {
        access: 'public',
        token,
        uploadId,
        key: pathname
      })
      return mapR2ObjectToBlob(putBlobResult)
    }
  }
}

function mapR2ObjectToBlob(object: PutBlobResult): BlobObject {
  return {
    pathname: object.pathname,
    url: object.url,
    contentType: object.contentType,
    size: 0, // TODO: get size
    httpEtag: '', // TODO: get etag
    uploadedAt: new Date(),
    httpMetadata: {},
    customMetadata: {}
  }
}
