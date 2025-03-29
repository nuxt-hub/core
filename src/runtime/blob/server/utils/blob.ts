import type { R2Bucket, ReadableStream, R2MultipartUpload, R2Object } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import mime from 'mime'
import { z } from 'zod'
import { type H3Event, getHeader, getRequestWebStream } from 'h3'
import { setHeader, createError, readFormData, getValidatedQuery, getValidatedRouterParams, readValidatedBody, sendNoContent, assertMethod } from 'h3'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { parse } from 'pathe'
import { joinURL } from 'ufo'
import type { BlobType, FileSizeUnit, BlobUploadedPart, BlobListResult, BlobMultipartUpload, HandleMPUResponse, BlobMultipartOptions, BlobUploadOptions, BlobPutOptions, BlobEnsureOptions, BlobObject, BlobListOptions, BlobCredentialsOptions, BlobCredentials } from '@nuxthub/core'
import { streamToArrayBuffer } from '../../../utils/stream'
import { requireNuxtHubFeature } from '../../../utils/features'
import { getCloudflareAccessHeaders } from '../../../utils/cloudflareAccess'
import { useRuntimeConfig } from '#imports'

const _r2_buckets: Record<string, R2Bucket> = {}

function getBlobBinding(name: string = 'BLOB') {
  // @ts-expect-error globalThis.__env__ is not typed
  return process.env[name] || globalThis.__env__?.[name] || globalThis[name]
}
function _useBucket(name: string = 'BLOB') {
  if (_r2_buckets[name]) {
    return _r2_buckets[name]
  }

  const binding = getBlobBinding(name)
  if (binding) {
    _r2_buckets[name] = binding as R2Bucket
    return _r2_buckets[name]
  }
  throw createError(`Missing Cloudflare ${name} binding (R2)`)
}

interface HubBlob {
  /**
   * List all the blobs in the bucket (metadata only).
   *
   * @param options The list options
   *
   * @example ```ts
   * const { blobs } = await hubBlob().list({ limit: 10 })
   * ```
   */
  list(options?: BlobListOptions): Promise<BlobListResult>
  /**
   * Serve the blob from the bucket.
   *
   * @param event The H3 event (needed to set headers for the response)
   * @param pathname The pathname of the blob
   *
   * @example ```ts
   * export default eventHandler(async (event) => {
   *   return hubBlob().serve(event, '/my-image.jpg')
   * })
   * ```
   */
  serve(event: H3Event, pathname: string): Promise<ReadableStream<any>>
  /**
   * Put a new blob into the bucket.
   *
   * @param pathname The pathname of the blob
   * @param body The blob content
   * @param options The put options
   *
   * @example ```ts
   * const blob = await hubBlob().put('/my-image.jpg', file)
   * ```
   */
  put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options?: BlobPutOptions): Promise<BlobObject>
  /**
   * Get the blob metadata from the bucket.
   *
   * @param pathname The pathname of the blob
   *
   * @example ```ts
   * const blobMetadata = await hubBlob().head('/my-image.jpg')
   * ```
   */
  head(pathname: string): Promise<BlobObject>
  /**
   * Get the blob body from the bucket.
   *
   * @param pathname The pathname of the blob
   *
   * @example ```ts
   * const blob = await hubBlob().get('/my-image.jpg')
   * ```
   */
  get(pathname: string): Promise<Blob | null>
  /**
   * Delete the blob from the bucket.
   *
   * @param pathnames The pathname of the blob
   *
   * @example ```ts
   * await hubBlob().del('/my-image.jpg')
   * ```
   */
  del(pathnames: string | string[]): Promise<void>
  /**
   * Delete the blob from the bucket.
   *
   * @param pathnames The pathname of the blob
   *
   * @example ```ts
   * await hubBlob().delete('/my-image.jpg')
   * ```
   */
  delete(pathnames: string | string[]): Promise<void>
  /**
   * Create a multipart upload.
   *
   * @see https://hub.nuxt.com/docs/features/blob#createmultipartupload
   */
  createMultipartUpload(pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload>
  /**
   * Get the specified multipart upload.
   *
   * @see https://hub.nuxt.com/docs/features/blob#resumemultipartupload
   */
  resumeMultipartUpload(pathname: string, uploadId: string): BlobMultipartUpload
  /**
   * Handle the multipart upload request.
   * Make sure your route includes `[action]` and `[...pathname]` params.
   *
   * @see https://hub.nuxt.com/docs/features/blob#handlemultipartupload
   */
  handleMultipartUpload(event: H3Event, options?: BlobMultipartOptions): Promise<HandleMPUResponse>
  /**
   * Handle a file upload.
   *
   * @param event The H3 event (needed to set headers for the response)
   * @param options The upload options
   *
   * @see https://hub.nuxt.com/docs/features/blob#handleupload
   */
  handleUpload(event: H3Event, options?: BlobUploadOptions): Promise<BlobObject[]>
  /**
   * Creates temporary access credentials that can be optionally scoped to prefixes or objects.
   *
   * Useful to create a signed url to upload directory to R2 from client-side.
   *
   * Only available in production or in development with `--remote` flag.
   *
   * @example ```ts
   * const { accountId, bucketName, accessKeyId, secretAccessKey, sessionToken } = await hubBlob().createCredentials()
   * ```
   */
  createCredentials(options?: BlobCredentialsOptions): Promise<BlobCredentials>
}

/**
 * Access the Blob storage.
 *
 * @example ```ts
 * const blob = hubBlob()
 * const { blobs } = await blob.list()
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/blob
 */
export function hubBlob(): HubBlob {
  requireNuxtHubFeature('blob')

  const hub = useRuntimeConfig().hub
  const binding = getBlobBinding()
  if (hub.remote && hub.projectUrl && !binding) {
    const cfAccessHeaders = getCloudflareAccessHeaders(hub.cloudflareAccess)
    return proxyHubBlob(hub.projectUrl, hub.projectSecretKey || hub.userToken, cfAccessHeaders)
  }
  const bucket = _useBucket()

  const blob = {
    async list(options?: BlobListOptions) {
      const resolvedOptions = defu(options, {
        limit: 1000,
        include: ['httpMetadata' as const, 'customMetadata' as const],
        delimiter: options?.folded ? '/' : undefined
      })

      // https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2listoptions
      const listed = await bucket.list(resolvedOptions)
      const hasMore = listed.truncated
      const cursor = listed.truncated ? listed.cursor : undefined

      return {
        blobs: listed.objects.map(mapR2ObjectToBlob),
        hasMore,
        cursor,
        folders: resolvedOptions.delimiter ? listed.delimitedPrefixes : undefined
      }
    },
    async serve(event: H3Event, pathname: string) {
      pathname = decodeURIComponent(pathname)
      const object = await bucket.get(pathname)

      if (!object) {
        throw createError({ message: 'File not found', statusCode: 404 })
      }

      setHeader(event, 'Content-Type', object.httpMetadata?.contentType || getContentType(pathname))
      setHeader(event, 'Content-Length', object.size)
      setHeader(event, 'etag', object.httpEtag)

      return object.body
    },
    async get(pathname: string): Promise<Blob | null> {
      const object = await bucket.get(decodeURIComponent(pathname))

      if (!object) {
        return null
      }

      return object.blob() as Promise<Blob>
    },
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: BlobPutOptions = {}) {
      pathname = decodeURIComponent(pathname)
      const { contentType: optionsContentType, contentLength, addRandomSuffix, prefix, customMetadata } = options
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

      const httpMetadata: Record<string, string> = { contentType }
      if (contentLength) {
        httpMetadata.contentLength = contentLength
      }

      const object = await bucket.put(pathname, body as any, { httpMetadata, customMetadata })

      return mapR2ObjectToBlob(object)
    },
    async head(pathname: string) {
      const object = await bucket.head(decodeURIComponent(pathname))

      if (!object) {
        throw createError({ message: 'Blob not found', statusCode: 404 })
      }

      return mapR2ObjectToBlob(object)
    },
    async del(pathnames: string | string[]) {
      if (Array.isArray(pathnames)) {
        return await bucket.delete(pathnames.map(p => decodeURIComponent(p)))
      } else {
        return await bucket.delete(decodeURIComponent(pathnames))
      }
    },
    async createMultipartUpload(pathname: string, options: BlobMultipartOptions = {}): Promise<BlobMultipartUpload> {
      pathname = decodeURIComponent(pathname)
      const { contentType: optionsContentType, contentLength, addRandomSuffix, prefix, customMetadata } = options
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

      const httpMetadata: Record<string, string> = { contentType }
      if (contentLength) {
        httpMetadata.contentLength = contentLength
      }

      const mpu = await bucket.createMultipartUpload(pathname, { httpMetadata, customMetadata })

      return mapR2MpuToBlobMpu(mpu)
    },
    resumeMultipartUpload(pathname: string, uploadId: string) {
      const mpu = bucket.resumeMultipartUpload(decodeURIComponent(pathname), uploadId)

      return mapR2MpuToBlobMpu(mpu)
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
    },
    async createCredentials(options: BlobCredentialsOptions = {}): Promise<BlobCredentials> {
      if (import.meta.dev) {
        throw createError('hubBlob().createCredentials() is only available in production or in development with `--remote` flag.')
      }
      if (!process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN) {
        throw createError('Missing `NUXT_HUB_PROJECT_DEPLOY_TOKEN` environment variable, make sure to deploy with `npx nuxthub deploy` or with the NuxtHub Admin.')
      }
      const env = process.env.NUXT_HUB_ENV || hub.env || 'production'
      return await $fetch(`/api/projects/${hub.projectKey}/blob/${env}/credentials`, {
        baseURL: hub.url,
        method: 'POST',
        body: options,
        headers: {
          authorization: `Bearer ${process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN}`
        }
      })
    }
  }
  return {
    ...blob,
    delete: blob.del,
    handleMultipartUpload: createMultipartUploadHandler(blob)
  }
}

/**
 * Access the remote Blob storage.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 * @param headers The headers to send with the request to the remote endpoint
 *
 * @example ```ts
 * const blob = proxyHubBlob('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * const { blobs } = await blob.list()
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/blob
 */
export function proxyHubBlob(projectUrl: string, secretKey?: string, headers?: HeadersInit): HubBlob {
  requireNuxtHubFeature('blob')

  const blobAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/blob'),
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...headers
    }
  })

  const blob = {
    async list(options: BlobListOptions = { limit: 1000 }) {
      return blobAPI<BlobListResult>('/', {
        method: 'GET',
        query: options
      })
    },
    async serve(_event: H3Event, pathname: string) {
      return blobAPI<ReadableStream<any>>(encodeURIComponent(pathname), {
        method: 'GET'
      })
    },
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob | Uint8Array, options: BlobPutOptions = {}) {
      const { contentType, contentLength, ...query } = options
      const headers: Record<string, string> = {}
      if (contentType) {
        headers['content-type'] = contentType
      }
      if (contentLength) {
        headers['content-length'] = contentLength
      }
      if (body instanceof Uint8Array) {
        body = new Blob([body])
      }
      return await blobAPI<BlobObject>(encodeURIComponent(pathname), {
        method: 'PUT',
        headers,
        body,
        query
      })
    },
    async head(pathname: string): Promise<BlobObject> {
      return await blobAPI(`/head/${encodeURIComponent(pathname)}`, {
        method: 'GET'
      })
    },
    async get(pathname: string): Promise<Blob | null> {
      return await blobAPI(`/${encodeURIComponent(pathname)}`, {
        method: 'GET',
        responseType: 'blob'
      }).catch((e) => {
        if (e.status === 404) {
          return null
        }
        throw e
      })
    },
    async del(pathnames: string | string[]) {
      if (Array.isArray(pathnames)) {
        await blobAPI('/delete', {
          method: 'POST',
          body: {
            pathnames: pathnames.map(p => encodeURIComponent(p))
          }
        })
      } else {
        await blobAPI(encodeURIComponent(pathnames), {
          method: 'DELETE'
        })
      }
      return
    },
    async createMultipartUpload(pathname: string, options: BlobMultipartOptions = {}) {
      return await blobAPI<BlobMultipartUpload>(`/multipart/create/${encodeURIComponent(pathname)}`, {
        method: 'POST',
        query: options
      })
    },
    resumeMultipartUpload(pathname: string, uploadId: string): BlobMultipartUpload {
      return {
        pathname,
        uploadId,
        async uploadPart(partNumber: number, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob): Promise<BlobUploadedPart> {
          return await blobAPI<BlobUploadedPart>(`/multipart/upload/${encodeURIComponent(pathname)}`, {
            method: 'PUT',
            query: {
              uploadId,
              partNumber
            },
            body
          })
        },
        async abort(): Promise<void> {
          await blobAPI(`/multipart/abort/${encodeURIComponent(pathname)}`, {
            method: 'DELETE',
            query: {
              uploadId
            }
          })
        },
        async complete(parts: BlobUploadedPart[]): Promise<BlobObject> {
          return await blobAPI<BlobObject>(`/multipart/complete/${encodeURIComponent(pathname)}`, {
            method: 'POST',
            query: {
              uploadId
            },
            body: {
              parts
            }
          })
        }
      }
    },
    async handleUpload(event: H3Event, options: BlobUploadOptions = {}) {
      return await blobAPI('/', {
        method: 'POST',
        body: await readFormData(event),
        query: options
      })
    },

    async createCredentials(options: BlobCredentialsOptions = {}): Promise<BlobCredentials> {
      return await blobAPI<BlobCredentials>('/credentials', {
        method: 'POST',
        body: options
      })
    }
  }

  return {
    ...blob,
    delete: blob.del,
    handleMultipartUpload: createMultipartUploadHandler(blob)
  }
}

function createMultipartUploadHandler(
  hub: Pick<HubBlob, 'createMultipartUpload' | 'resumeMultipartUpload'>
): HubBlob['handleMultipartUpload'] {
  const { createMultipartUpload, resumeMultipartUpload } = hub

  const createHandler = async (event: H3Event, options?: BlobMultipartOptions) => {
    const { pathname } = await getValidatedRouterParams(event, z.object({
      pathname: z.string().min(1)
    }).parse)

    options ||= {}
    if (getHeader(event, 'x-nuxthub-file-content-type')) {
      options.contentType ||= getHeader(event, 'x-nuxthub-file-content-type')
    }

    try {
      const object = await createMultipartUpload(pathname, options)
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

    const mpu = resumeMultipartUpload(pathname, uploadId)

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

    const mpu = resumeMultipartUpload(pathname, uploadId)
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

    const mpu = resumeMultipartUpload(pathname, uploadId)

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

function mapR2MpuToBlobMpu(mpu: R2MultipartUpload): BlobMultipartUpload {
  return {
    pathname: mpu.key,
    uploadId: mpu.uploadId,
    async uploadPart(partNumber: number, value: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob) {
      return await mpu.uploadPart(partNumber, value as any)
    },
    abort: mpu.abort,
    async complete(uploadedParts: BlobUploadedPart[]) {
      const object = await mpu.complete(uploadedParts)
      return mapR2ObjectToBlob(object)
    }
  }
}

// Credits from shared utils of https://github.com/pingdotgg/uploadthing
const FILESIZE_UNITS = ['B', 'KB', 'MB', 'GB']

function fileSizeToBytes(input: string) {
  const regex = new RegExp(
    `^(\\d+)(\\.\\d+)?\\s*(${FILESIZE_UNITS.join('|')})$`,
    'i'
  )
  const match = input.match(regex)

  if (!match) {
    throw createError({ statusCode: 400, message: `Invalid file size format: ${input}` })
  }

  const sizeValue = Number.parseFloat(match[1])
  const sizeUnit = match[3].toUpperCase() as FileSizeUnit

  if (!FILESIZE_UNITS.includes(sizeUnit)) {
    throw createError({ statusCode: 400, message: `Invalid file size unit: ${sizeUnit}` })
  }
  const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit))
  return Math.floor(bytes)
}

/**
 * Ensure the blob is valid and meets the specified requirements.
 *
 * @param blob The blob to check
 * @param options The options to check against
 * @param options.maxSize The maximum size of the blob (e.g. '1MB')
 * @param options.types The allowed types of the blob (e.g. ['image/png', 'application/json', 'video'])
 *
 * @throws If the blob does not meet the requirements
 */
export function ensureBlob(blob: Blob, options: BlobEnsureOptions = {}) {
  requireNuxtHubFeature('blob')

  if (!options.maxSize && !options.types?.length) {
    throw createError({
      statusCode: 400,
      message: 'ensureBlob() requires at least one of maxSize or types to be set.'
    })
  }
  if (options.maxSize) {
    const maxFileSizeBytes = fileSizeToBytes(options.maxSize)
    if (blob.size > maxFileSizeBytes) {
      throw createError({
        statusCode: 400,
        message: `File size must be less than ${options.maxSize}`
      })
    }
  }
  const blobShortType = blob.type.split('/')[0]
  if (options.types?.length
    && !options.types.includes(blob.type as BlobType)
    && !options.types.includes(blobShortType as BlobType)
    && !(options.types.includes('pdf' as BlobType) && blob.type === 'application/pdf')
  ) {
    throw createError({
      statusCode: 400,
      message: `File type is invalid, must be: ${options.types.join(', ')}`
    })
  }
}
