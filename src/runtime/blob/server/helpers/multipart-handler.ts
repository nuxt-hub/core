import * as z from 'zod'
import type { H3Event } from 'h3'
import type { BlobMultipartOptions } from '@nuxthub/core'
import type { BlobStorage } from './blob-storage'
import { createError, getValidatedQuery, readValidatedBody, getRequestWebStream, sendNoContent, getHeader, getValidatedRouterParams } from 'h3'
import { streamToArrayBuffer } from '../../../utils/stream'

export function createMultipartUploadHandler(storage: BlobStorage) {
  if (storage.driverName === 'vercel-blob') {
    return async (event: H3Event, options?: BlobMultipartOptions) =>
      import('../helpers/blob-vercel')
        .then(({ multipartUploadHandler }) => multipartUploadHandler(event, options))
  }

  return createMultipartUploadHandlerWithBlobStorage(storage)
}

function createMultipartUploadHandlerWithBlobStorage(blobStorage: BlobStorage) {
  const createHandler = async (event: H3Event, options?: BlobMultipartOptions) => {
    const { pathname } = await getValidatedRouterParams(event, z.object({
      pathname: z.string().min(1)
    }).parse)

    options ||= {}
    if (getHeader(event, 'x-nuxthub-file-content-type')) {
      options.contentType ||= getHeader(event, 'x-nuxthub-file-content-type')
    }

    try {
      const object = await blobStorage.createMultipartUpload(pathname, options)
      return {
        uploadId: object.uploadId,
        pathname: object.pathname
      }
    } catch (e: any) {
      throw createError({
        statusCode: 400,
        message: e.message
      })
    }
  }

  const uploadHandler = async (event: H3Event) => {
    const { pathname } = await getValidatedRouterParams(event, z.object({
      pathname: z.string().min(1)
    }).parse)

    const { uploadId, partNumber } = await getValidatedQuery(event, z.object({
      uploadId: z.string(),
      partNumber: z.coerce.number()
    }).parse)

    const contentLength = Number(getHeader(event, 'content-length') || '0')

    const stream = getRequestWebStream(event)!
    const body = await streamToArrayBuffer(stream, contentLength)

    const mpu = await blobStorage.resumeMultipartUpload(pathname, uploadId)

    try {
      return await mpu.uploadPart(partNumber, body)
    } catch (e: any) {
      throw createError({ status: 400, message: e.message })
    }
  }

  const completeHandler = async (event: H3Event) => {
    const { pathname } = await getValidatedRouterParams(event, z.object({
      pathname: z.string().min(1)
    }).parse)

    const { uploadId } = await getValidatedQuery(event, z.object({
      uploadId: z.string().min(1)
    }).parse)

    const { parts } = await readValidatedBody(event, z.object({
      parts: z.array(z.object({
        partNumber: z.number(),
        etag: z.string()
      }))
    }).parse)

    const mpu = await blobStorage.resumeMultipartUpload(pathname, uploadId)
    try {
      const object = await mpu.complete(parts)
      return object
    } catch (e: any) {
      throw createError({ status: 400, message: e.message })
    }
  }

  const abortHandler = async (event: H3Event) => {
    const { pathname } = await getValidatedRouterParams(event, z.object({
      pathname: z.string().min(1)
    }).parse)

    const { uploadId } = await getValidatedQuery(event, z.object({
      uploadId: z.string().min(1)
    }).parse)

    const mpu = await blobStorage.resumeMultipartUpload(pathname, uploadId)

    try {
      await mpu.abort()
    } catch (e: any) {
      throw createError({ status: 400, message: e.message })
    }
  }

  const handler = async (event: H3Event, options?: BlobMultipartOptions) => {
    const method = event.method
    const { action } = await getValidatedRouterParams(event, z.object({
      action: z.enum(['create', 'upload', 'complete', 'abort'])
    }).parse)

    if (action === 'create' && method === 'POST') {
      return {
        action,
        data: await createHandler(event, options)
      }
    }

    if (action === 'upload' && method === 'PUT') {
      return {
        action,
        data: await uploadHandler(event)
      }
    }

    if (action === 'complete' && method === 'POST') {
      return {
        action,
        data: await completeHandler(event)
      }
    }

    if (action === 'abort' && method === 'DELETE') {
      return {
        action,
        data: await abortHandler(event)
      }
    }

    throw createError({ status: 405 })
  }

  return async (event: H3Event, options?: BlobMultipartOptions) => {
    const result = await handler(event, options)

    if (result.data) {
      event.respondWith(Response.json(result.data))
    } else {
      sendNoContent(event)
    }
    return result
  }
}
