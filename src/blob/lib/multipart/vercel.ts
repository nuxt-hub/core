import { readBody, type H3Event } from 'h3'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import type { PutBlobResult } from '@vercel/blob'
import { createMultipartUpload as vercelCreateMultipartUpload, uploadPart as vercelUploadPart, completeMultipartUpload as vercelCompleteMultipartUpload } from '@vercel/blob'
import type { BlobMultipartOptions, BlobMultipartUpload, BlobObject, HandleMPUResponse } from '../../types/index'

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
      // Vercel Blob does not support aborting a multipart upload
    },
    complete: async (uploadedParts) => {
      const r2Object = await vercelCompleteMultipartUpload(pathname, uploadedParts, {
        access: 'public',
        token,
        contentType: options?.contentType || 'application/octet-stream',
        uploadId,
        key
      })
      return mapPutBlobToBlob(r2Object)
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
      // Vercel Blob does not support aborting a multipart upload
    },
    complete: async (uploadedParts) => {
      const putBlobResult = await vercelCompleteMultipartUpload(pathname, uploadedParts, {
        access: 'public',
        token,
        uploadId,
        key: pathname
      })
      return mapPutBlobToBlob(putBlobResult)
    }
  }
}

export const multipartUploadHandler = async (event: H3Event, options?: BlobMultipartOptions): Promise<HandleMPUResponse> => {
  const body = await readBody<HandleUploadBody>(event)

  const json = await handleUpload({
    body,
    request: event.node.req,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const result = options?.onBeforeGenerateToken ? options?.onBeforeGenerateToken?.(pathname, clientPayload) : {}
      return { ...options, ...result }
    },
    onUploadCompleted: options?.onUploadCompleted || undefined
  })

  return json as unknown as HandleMPUResponse
}

function mapPutBlobToBlob(object: PutBlobResult): BlobObject {
  return {
    pathname: object.pathname,
    contentType: object.contentType,
    url: object.url,
    httpEtag: undefined,
    uploadedAt: new Date(),
    httpMetadata: {},
    customMetadata: {}
  }
}
