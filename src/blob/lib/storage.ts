import * as z from 'zod'
import type { BlobStorage, BlobListOptions, BlobMultipartOptions, BlobObject, BlobPutOptions, BlobUploadOptions, HandleMPUResponse } from '../types'
import type { BlobDriver } from './drivers/types'
import { defu } from 'defu'
import { getContentType, streamToArrayBuffer } from './utils'
import { setHeader, createError, assertMethod, readFormData, getValidatedQuery, readValidatedBody, getRequestWebStream, sendNoContent, getHeader, getValidatedRouterParams } from 'h3'
import type { H3Event } from 'h3'
import { parse } from 'pathe'
import { joinURL } from 'ufo'
import { randomUUID } from 'uncrypto'
import { ensureBlob } from './ensure'

export type * from '../types'

export function createBlobStorage(driver: BlobDriver<any>): BlobStorage {
  const blob = {
    driver,

    async list(options?: BlobListOptions) {
      const resolvedOptions = defu(options, {
        limit: 1000
      })

      return driver.list(resolvedOptions)
    },

    async serve(event: H3Event, pathname: string) {
      pathname = decodeURIComponent(pathname)
      const arrayBuffer = await driver.getArrayBuffer(pathname)

      if (!arrayBuffer) {
        throw createError({ message: 'File not found', statusCode: 404 })
      }

      const meta = await driver.head(pathname)
      const contentType = meta?.contentType || getContentType(pathname)

      setHeader(event, 'Content-Type', contentType)
      setHeader(event, 'Content-Length', arrayBuffer.byteLength)
      if (meta?.httpEtag) {
        setHeader(event, 'etag', meta.httpEtag)
      }

      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(arrayBuffer))
          controller.close()
        }
      })
    },

    async get(pathname: string): Promise<Blob | null> {
      return driver.get(decodeURIComponent(pathname))
    },

    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: BlobPutOptions = {}) {
      pathname = decodeURIComponent(pathname)
      const { contentType: optionsContentType, contentLength, addRandomSuffix, prefix, customMetadata, access } = options
      const contentType = optionsContentType || (body as Blob).type || getContentType(pathname)

      const { dir, ext, name: filename } = parse(pathname)
      if (addRandomSuffix) {
        pathname = joinURL(dir === '.' ? '' : dir, `${filename}-${randomUUID().split('-')[0]}${ext}`)
      } else {
        pathname = joinURL(dir === '.' ? '' : dir, `${filename}${ext}`)
      }

      if (prefix) {
        pathname = joinURL(prefix, pathname).replace(/\/+/g, '/').replace(/^\/+/, '')
      }

      return driver.put(pathname, body, {
        contentType,
        contentLength,
        customMetadata,
        access
      })
    },

    async head(pathname: string) {
      pathname = decodeURIComponent(pathname)
      const meta = await driver.head(pathname)

      if (!meta) {
        throw createError({ message: 'Blob not found', statusCode: 404 })
      }

      return meta
    },

    async del(pathnames: string | string[]) {
      const paths = Array.isArray(pathnames) ? pathnames : [pathnames]
      await driver.delete(paths.map(p => decodeURIComponent(p)))
    },

    async delete(pathnames: string | string[]) {
      return this.del(pathnames)
    },

    async createMultipartUpload(pathname: string, options: BlobMultipartOptions = {}) {
      pathname = decodeURIComponent(pathname)
      const { contentType: optionsContentType, addRandomSuffix, prefix } = options
      const contentType = optionsContentType || getContentType(pathname)

      const { dir, ext, name: filename } = parse(pathname)
      if (addRandomSuffix) {
        pathname = joinURL(dir === '.' ? '' : dir, `${filename}-${randomUUID().split('-')[0]}${ext}`)
      } else {
        pathname = joinURL(dir === '.' ? '' : dir, `${filename}${ext}`)
      }
      if (prefix) {
        pathname = joinURL(prefix, pathname).replace(/\/+/g, '/').replace(/^\/+/, '')
      }

      return driver.createMultipartUpload(pathname, {
        ...options,
        contentType
      })
    },

    async resumeMultipartUpload(pathname: string, uploadId: string) {
      return driver.resumeMultipartUpload(decodeURIComponent(pathname), uploadId)
    },

    async handleUpload(event: H3Event, options: BlobUploadOptions = {}) {
      assertMethod(event, ['POST', 'PUT', 'PATCH'])

      options = defu(options, {
        formKey: 'files',
        multiple: true
      })
      const form = await readFormData(event)
      const files = form.getAll(options.formKey!) as File[]
      if (!files) {
        throw createError({ statusCode: 400, message: 'Missing files' })
      }
      if (!options.multiple && files.length > 1) {
        throw createError({ statusCode: 400, message: 'Multiple files are not allowed' })
      }

      const objects: BlobObject[] = []
      try {
        // Ensure the files meet the requirements
        if (options.ensure) {
          for (const file of files) {
            ensureBlob(file, options.ensure)
          }
        }
        for (const file of files) {
          const object = await blob.put(file.name!, file, options.put)
          objects.push(object)
        }
      } catch (e: any) {
        throw createError({
          statusCode: 500,
          message: `Storage error: ${e.message}`
        })
      }

      return objects
    }
  } satisfies Omit<BlobStorage, 'handleMultipartUpload'>

  return {
    ...blob,
    handleMultipartUpload: driver.handleMultipartUpload ?? createGenericMultipartUploadHandler(blob as BlobStorage)
  } satisfies BlobStorage
}

/**
 * Create the generic multipart upload handler for drivers that don't have a custom implementation
 */
function createGenericMultipartUploadHandler(blob: BlobStorage) {
  const createHandler = async (event: H3Event, options?: BlobMultipartOptions) => {
    const { pathname } = await getValidatedRouterParams(event, z.object({
      pathname: z.string().min(1)
    }).parse)

    options ||= {}
    if (getHeader(event, 'x-nuxthub-file-content-type')) {
      options.contentType ||= getHeader(event, 'x-nuxthub-file-content-type')
    }

    try {
      const object = await blob.createMultipartUpload(pathname, options)
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

    const mpu = await blob.resumeMultipartUpload(pathname, uploadId)

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

    const mpu = await blob.resumeMultipartUpload(pathname, uploadId)
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

    const mpu = await blob.resumeMultipartUpload(pathname, uploadId)

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

  return async (event: H3Event, options?: BlobMultipartOptions): Promise<HandleMPUResponse> => {
    const result = await handler(event, options)

    if (result.data) {
      event.respondWith(Response.json(result.data))
    } else {
      sendNoContent(event)
    }
    return result as HandleMPUResponse
  }
}
