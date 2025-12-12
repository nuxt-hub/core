import { put as vercelPut, del as vercelDel, head as vercelHead, list as vercelList, createMultipartUpload as vercelCreateMultipartUpload, uploadPart as vercelUploadPart, completeMultipartUpload as vercelCompleteMultipartUpload } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import type { PutBlobResult, ListBlobResultBlob } from '@vercel/blob'
import { createError, readBody, type H3Event } from 'h3'
import type { BlobDriver, BlobPutBody } from './types'
import type { BlobListOptions, BlobListResult, BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobPutOptions, BlobUploadedPart, HandleMPUResponse } from '../../types'
import { getContentType } from '../utils'

export interface VercelDriverOptions {
  token?: string
  access?: 'public' | 'private'
}

function mapVercelBlobToBlob(blob: PutBlobResult | ListBlobResultBlob): BlobObject {
  return {
    pathname: blob.pathname,
    contentType: ('contentType' in blob ? blob.contentType : undefined) || getContentType(blob.pathname),
    size: 'size' in blob ? blob.size : undefined,
    httpEtag: undefined,
    uploadedAt: 'uploadedAt' in blob ? blob.uploadedAt : new Date(),
    httpMetadata: {},
    customMetadata: {},
    url: blob.url
  }
}

export function createDriver(options: VercelDriverOptions = {}): BlobDriver<VercelDriverOptions> {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN
  const access = options.access || 'public'

  return {
    name: 'vercel-blob',
    options: options as Record<string, unknown>,

    async list(listOptions?: BlobListOptions): Promise<BlobListResult> {
      const result = await vercelList({
        token,
        limit: listOptions?.limit ?? 1000,
        prefix: listOptions?.prefix,
        cursor: listOptions?.cursor,
        mode: listOptions?.folded ? 'folded' : 'expanded'
      })

      return {
        blobs: result.blobs.map(mapVercelBlobToBlob),
        hasMore: result.hasMore,
        cursor: result.cursor,
        folders: 'folders' in result ? result.folders : undefined
      }
    },

    async get(pathname: string): Promise<Blob | null> {
      try {
        // Vercel Blob requires the full URL to get content
        const headResult = await vercelHead(decodeURIComponent(pathname), { token })
        if (!headResult) return null

        const res = await fetch(headResult.url)
        if (!res.ok) return null

        return res.blob()
      } catch {
        return null
      }
    },

    async getArrayBuffer(pathname: string): Promise<ArrayBuffer | null> {
      try {
        const headResult = await vercelHead(decodeURIComponent(pathname), { token })
        if (!headResult) return null

        const res = await fetch(headResult.url)
        if (!res.ok) return null

        return res.arrayBuffer()
      } catch {
        return null
      }
    },

    async put(pathname: string, body: BlobPutBody, putOptions?: BlobPutOptions): Promise<BlobObject> {
      const contentType = putOptions?.contentType || (body instanceof Blob ? body.type : undefined) || getContentType(pathname)

      if (putOptions?.access === 'private') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Private access is not yet supported for Vercel Blob'
        })
      }
      const result = await vercelPut(pathname, body as any, {
        token,
        access: access as 'public',
        contentType
        // Note: Vercel Blob doesn't support custom metadata in the same way
      })

      return mapVercelBlobToBlob(result)
    },

    async head(pathname: string): Promise<BlobObject | null> {
      try {
        const result = await vercelHead(decodeURIComponent(pathname), { token })
        if (!result) return null

        return mapVercelBlobToBlob(result)
      } catch {
        return null
      }
    },

    async hasItem(pathname: string): Promise<boolean> {
      try {
        const result = await vercelHead(decodeURIComponent(pathname), { token })
        return result !== null
      } catch {
        return false
      }
    },

    async delete(pathnames: string | string[]): Promise<void> {
      const paths = Array.isArray(pathnames) ? pathnames : [pathnames]
      // Vercel del expects URLs, but we have pathnames
      // We need to get the URLs first via head or construct them
      for (const pathname of paths) {
        try {
          const headResult = await vercelHead(decodeURIComponent(pathname), { token })
          if (headResult) {
            await vercelDel(headResult.url, { token })
          }
        } catch {
          // Ignore errors for non-existent blobs
        }
      }
    },

    async createMultipartUpload(pathname: string, mpuOptions?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
      const { key, uploadId } = await vercelCreateMultipartUpload(pathname, {
        access: access as 'public',
        token,
        contentType: mpuOptions?.contentType || getContentType(pathname)
      })

      return {
        pathname,
        uploadId,
        async uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
          return vercelUploadPart(pathname, value as any, {
            access: access as 'public',
            token,
            contentType: mpuOptions?.contentType || getContentType(pathname),
            uploadId,
            key,
            partNumber
          })
        },
        async abort(): Promise<void> {
          // Vercel Blob does not support aborting a multipart upload
        },
        async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
          const result = await vercelCompleteMultipartUpload(pathname, uploadedParts, {
            access: access as 'public',
            token,
            contentType: mpuOptions?.contentType || getContentType(pathname),
            uploadId,
            key
          })
          return mapVercelBlobToBlob(result)
        }
      }
    },

    async resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload> {
      return {
        pathname,
        uploadId,
        async uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
          return vercelUploadPart(pathname, value as any, {
            access: access as 'public',
            token,
            uploadId,
            partNumber,
            key: pathname
          })
        },
        async abort(): Promise<void> {
          // Vercel Blob does not support aborting a multipart upload
        },
        async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
          const result = await vercelCompleteMultipartUpload(pathname, uploadedParts, {
            access: access as 'public',
            token,
            uploadId,
            key: pathname
          })
          return mapVercelBlobToBlob(result)
        }
      }
    },

    /**
     * Vercel-specific multipart upload handler using @vercel/blob/client
     */
    async handleMultipartUpload(event: H3Event, mpuOptions?: BlobMultipartOptions): Promise<HandleMPUResponse> {
      const body = await readBody<HandleUploadBody>(event)

      const json = await handleUpload({
        body,
        request: event.node.req,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const result = mpuOptions?.onBeforeGenerateToken ? mpuOptions?.onBeforeGenerateToken?.(pathname, clientPayload) : {}
          return { ...mpuOptions, ...result }
        },
        onUploadCompleted: mpuOptions?.onUploadCompleted || undefined
      })

      return json as unknown as HandleMPUResponse
    }
  }
}
