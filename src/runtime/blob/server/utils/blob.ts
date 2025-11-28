import mime from 'mime'
import type { H3Event } from 'h3'
import { setHeader, createError, readFormData, assertMethod } from 'h3'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { parse } from 'pathe'
import { joinURL } from 'ufo'
import { requireNuxtHubFeature } from '../../../utils/features'
import type { BlobType, FileSizeUnit, BlobListResult, BlobUploadOptions, BlobPutOptions, BlobEnsureOptions, BlobObject, BlobListOptions, BlobMultipartUpload, BlobMultipartOptions, HandleMPUResponse } from '@nuxthub/core'
import { useStorage } from '#imports'
import { blobStorage } from '../helpers/blob-storage'
import { createMultipartUploadHandler } from '../helpers/multipart-handler'

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
  resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload>
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

  const storage = blobStorage(useStorage('blob'), 'blob')

  const blob = {
    storage,
    async list(options?: BlobListOptions) {
      const resolvedOptions = defu(options, {
        limit: 1000,
        include: ['httpMetadata' as const, 'customMetadata' as const],
        delimiter: options?.folded ? '/' : undefined
      })

      // Convert "/" to ":" in prefix for unstorage driver compatibility
      if (resolvedOptions.prefix) {
        resolvedOptions.prefix = resolvedOptions.prefix.replace(/\//g, ':')
      }

      // TODO: cursor based pagination
      const listed = await storage.getKeys(resolvedOptions.prefix)
      const hasMore = false
      const cursor = undefined

      // Convert keys to blob objects
      const blobs: BlobObject[] = []
      await Promise.all(listed.map(async (key) => {
        try {
          const meta = await storage.getMeta(key)
          blobs.push({
            pathname: key.replace(/:/g, '/'), // Convert ":" back to "/" for consumer
            contentType: getContentType(key),
            size: typeof meta?.size === 'number' ? meta.size : 0,
            httpEtag: typeof meta?.etag === 'string' ? meta.etag : '',
            uploadedAt: meta?.mtime || new Date(),
            httpMetadata: {},
            customMetadata: (meta || {}) as Record<string, string>
          })
        } catch (error) {
          return
        }
      }))

      // Handle folders if folded option is enabled
      const folders: string[] = []
      if (resolvedOptions.folded) {
        const folderSet = new Set<string>()
        for (const key of listed) {
          const relativePath = resolvedOptions.prefix ? key.replace(resolvedOptions.prefix, '') : key
          const colonIndex = relativePath.indexOf(':')
          if (colonIndex > 0) {
            const folder = relativePath.substring(0, colonIndex + 1).replace(/:/g, '/')
            folderSet.add((resolvedOptions.prefix || '').replace(/:/g, '/') + folder)
          }
        }
        folders.push(...Array.from(folderSet))
      }

      return {
        blobs: resolvedOptions.folded
          ? blobs.filter((blob) => {
              const relativePath = resolvedOptions.prefix
                ? blob.pathname.replace(resolvedOptions.prefix.replace(/:/g, '/'), '')
                : blob.pathname
              return !relativePath.includes('/')
            })
          : blobs,
        hasMore,
        cursor,
        folders: resolvedOptions.folded ? folders : undefined
      }
    },
    async serve(event: H3Event, pathname: string) {
      pathname = decodeURIComponent(pathname).replace(/\//g, ':') // Convert "/" to ":" for unstorage
      const arrayBuffer = await storage.getItemRaw(pathname, { type: 'arrayBuffer' })

      if (!arrayBuffer) {
        throw createError({ message: 'File not found', statusCode: 404 })
      }

      const meta = await storage.getMeta(pathname)
      const contentType = getContentType(pathname)
      setHeader(event, 'Content-Type', contentType)
      setHeader(event, 'Content-Length', (arrayBuffer as ArrayBuffer).byteLength)
      if (meta?.etag) {
        setHeader(event, 'etag', meta.etag)
      }

      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(arrayBuffer as ArrayBuffer))
          controller.close()
        }
      })
    },
    async get(pathname: string): Promise<Blob | null> {
      const arrayBuffer = await storage.getItemRaw(decodeURIComponent(pathname).replace(/\//g, ':'), { type: 'arrayBuffer' })

      if (!arrayBuffer) {
        return null
      }

      return new Blob([arrayBuffer])
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
        // Convert "/" to ":" for unstorage driver compatibility
        pathname = pathname.replace(/\//g, ':')
      }

      const httpMetadata: Record<string, string> = { contentType }
      if (contentLength) {
        httpMetadata.contentLength = contentLength
      }

      if (!storage.setItemRaw) {
        throw createError({ statusCode: 500, message: 'Storage does not implement setItemRaw' })
      }

      // Convert File or Blob to TypedArray for storage
      let processedBody = body as string | ReadableStream<any> | ArrayBuffer | ArrayBufferView
      if (body instanceof Blob) {
        const arrayBuffer = await body.arrayBuffer()
        processedBody = new Uint8Array(arrayBuffer)
      }

      // Check if setItemRaw accepts 3 parameters (key, value, options) or just 2 (key, value)
      if (storage.setItemRaw.length >= 3) {
        // Driver supports 3 parameters - assuming it's R2 so passing httpMetadata and customMetadata directly
        await storage.setItemRaw(pathname, processedBody, { httpMetadata, customMetadata })
      } else {
        // Driver only accepts 2 parameters - use setMeta for custom metadata
        await storage.setItemRaw(pathname, processedBody)

        // Store custom metadata separately if provided and setMeta is available
        if (customMetadata && Object.keys(customMetadata).length > 0 && storage.setMeta) {
          await storage.setMeta(pathname, customMetadata)
        }
      }

      // Return the created blob object
      return {
        pathname: pathname.replace(/:/g, '/'), // Convert ":" back to "/" for backwards compat with R2's hubBlob()
        contentType,
        size: typeof body === 'string'
          ? new TextEncoder().encode(body).length
          : body instanceof ArrayBuffer
            ? body.byteLength
            : body instanceof Blob
              ? body.size
              : processedBody instanceof ArrayBuffer
                ? processedBody.byteLength
                : (processedBody as ArrayBufferView)?.byteLength || 0,
        httpEtag: '',
        uploadedAt: new Date(),
        httpMetadata: httpMetadata,
        customMetadata: customMetadata || {}
      }
    },
    async head(pathname: string) {
      pathname = decodeURIComponent(pathname).replace(/\//g, ':') // Convert "/" to ":" for unstorage
      const hasItem = await storage.hasItem(pathname)

      if (!hasItem) {
        throw createError({ message: 'Blob not found', statusCode: 404 })
      }

      const meta = await storage.getMeta(pathname)

      return {
        pathname: pathname.replace(/:/g, '/'), // Convert ":" back to "/" for consumer
        contentType: getContentType(pathname),
        size: typeof meta?.size === 'number' ? meta.size : 0,
        httpEtag: typeof meta?.etag === 'string' ? meta.etag : '',
        uploadedAt: meta?.mtime || new Date(),
        httpMetadata: {},
        customMetadata: (meta || {}) as Record<string, string>
      }
    },
    async del(pathnames: string | string[]) {
      if (Array.isArray(pathnames)) {
        for (const pathname of pathnames) {
          const key = decodeURIComponent(pathname).replace(/\//g, ':')
          await Promise.all([
            storage.removeItem(key),
            storage.removeMeta?.(key)
          ])
        }
      } else {
        const key = decodeURIComponent(pathnames).replace(/\//g, ':')
        await Promise.all([
          storage.removeItem(key),
          storage.removeMeta?.(key)
        ])
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

      return await storage.createMultipartUpload(pathname, { httpMetadata, customMetadata })
    },
    async resumeMultipartUpload(pathname: string, uploadId: string) {
      return await storage.resumeMultipartUpload(decodeURIComponent(pathname), uploadId)
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
  }
  return {
    ...blob,
    delete: blob.del,
    handleMultipartUpload: createMultipartUploadHandler(storage)
  }
}

function getContentType(pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
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

  const sizeValue = Number.parseFloat(match[1]!)
  const sizeUnit = match[3]!.toUpperCase() as FileSizeUnit

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
