import type { extensions } from '@uploadthing/mime-types'
import slugify from '@sindresorhus/slugify'
import type { R2Bucket, ReadableStream } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import mime from 'mime'
import type { H3Event } from 'h3'
import { setHeader, createError } from 'h3'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { parse } from 'pathe'
import { joinURL } from 'ufo'
import { requireNuxtHubFeature } from './features'
import { useRuntimeConfig } from '#imports'

export interface BlobObject {
  /**
   * The pathname of the blob, used to @see {@link HubBlob.serve} the blob.
   */
  pathname: string
  /**
   * The content type of the blob.
   */
  contentType: string | undefined
  /**
   * The size of the blob in bytes.
   */
  size: number
  /**
   * The date the blob was uploaded at.
   */
  uploadedAt: Date
}

export interface BlobListOptions {
  /**
   * The maximum number of blobs to return per request.
   * @default 1000
   */
  limit?: number
  /**
   * The prefix to filter the blobs by.
   */
  prefix?: string
  /**
   * The cursor to list the blobs from (used for pagination).
   */
  cursor?: string
  /**
   * View prefixes as directory.
   */
  folded?: boolean
}

export interface BlobPutOptions {
  /**
   * The content type of the blob.
   */
  contentType?: string
  /**
   * The content length of the blob.
   */
  contentLength?: string
  /**
   * If a random suffix is added to the blob pathname.
   * @default false
   */
  addRandomSuffix?: boolean
  /**
   * The prefix to use for the blob pathname.
   */
  prefix?: string
  [key: string]: any
}

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

export interface BlobListResult {
  /**
   * The list of blobs.
   */
  blobs: BlobObject[]
  /**
   * The Boolean indicating if there are more blobs to list.
   */
  hasMore: boolean
  /**
   * The cursor to use for pagination.
   */
  cursor?: string
  /**
   * The list of folders with `/` delimiter.
   */
  folders?: string[]
}

interface HubBlob {
  /**
   * List all the blobs in the bucket.
   *
   * @param options The list options
   */
  list(options?: BlobListOptions): Promise<BlobListResult>
  /**
   * Serve the blob from the bucket.
   *
   * @param event The H3 event (needed to set headers for the response)
   * @param pathname The pathname of the blob
   */
  serve(event: H3Event, pathname: string): Promise<ReadableStream<any>>
  /**
   * Put a new blob into the bucket.
   *
   * @param pathname The pathname of the blob
   * @param body The blob content
   * @param options The put options
   */
  put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options?: BlobPutOptions): Promise<BlobObject>
  /**
   * Get the blob metadata from the bucket.
   *
   * @param pathname The pathname of the blob
   */
  head(pathname: string): Promise<BlobObject>
  /**
   * Delete the blob from the bucket.
   *
   * @param pathnames The pathname of the blob
   */
  del(pathnames: string | string[]): Promise<void>
  /**
   * Delete the blob from the bucket.
   *
   * @param pathnames The pathname of the blob
   */
  delete(pathnames: string | string[]): Promise<void>
}

/**
 * Access the Blob storage.
 *
 * @example ```ts
 * const blob = hubBlob()
 * const { blobs } = await blob.list()
 * ```
 *
 * @see https://hub.nuxt.com/docs/storage/blob
 */
export function hubBlob(): HubBlob {
  requireNuxtHubFeature('blob')

  const hub = useRuntimeConfig().hub
  const binding = getBlobBinding()
  if (hub.remote && hub.projectUrl && !binding) {
    return proxyHubBlob(hub.projectUrl, hub.projectSecretKey || hub.userToken)
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
      const object = await bucket.get(decodeURI(pathname))

      if (!object) {
        throw createError({ message: 'File not found', statusCode: 404 })
      }

      setHeader(event, 'Content-Type', object.httpMetadata?.contentType || getContentType(pathname))
      setHeader(event, 'Content-Length', object.size)

      return object.body
    },
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: BlobPutOptions = {}) {
      pathname = decodeURI(pathname)
      const { contentType: optionsContentType, contentLength, addRandomSuffix, prefix, ...customMetadata } = options
      const contentType = optionsContentType || (body as Blob).type || getContentType(pathname)

      const { dir, ext, name: filename } = parse(pathname)
      if (addRandomSuffix) {
        pathname = joinURL(dir === '.' ? '' : dir, `${slugify(filename)}-${randomUUID().split('-')[0]}${ext}`)
      } else {
        pathname = joinURL(dir === '.' ? '' : dir, `${slugify(filename)}${ext}`)
      }

      if (prefix) {
        pathname = joinURL(prefix, pathname)
      }

      const httpMetadata: Record<string, string> = { contentType }
      if (contentLength) {
        httpMetadata.contentLength = contentLength
      }

      const object = await bucket.put(pathname, body as any, { httpMetadata, customMetadata })

      return mapR2ObjectToBlob(object)
    },
    async head(pathname: string) {
      const object = await bucket.head(decodeURI(pathname))

      if (!object) {
        throw createError({ message: 'Blob not found', statusCode: 404 })
      }

      return mapR2ObjectToBlob(object)
    },
    async del(pathnames: string | string[]) {
      if (Array.isArray(pathnames)) {
        return await bucket.delete(pathnames.map(p => decodeURI(p)))
      } else {
        return await bucket.delete(decodeURI(pathnames))
      }
    }
  }
  return {
    ...blob,
    delete: blob.del
  }
}

/**
 * Access the remote Blob storage.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 *
 * @example ```ts
 * const blob = proxyHubBlob('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * const { blobs } = await blob.list()
 * ```
 *
 * @see https://hub.nuxt.com/docs/storage/blob
 */
export function proxyHubBlob(projectUrl: string, secretKey?: string) {
  requireNuxtHubFeature('blob')

  const blobAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/blob'),
    headers: {
      Authorization: `Bearer ${secretKey}`
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
      return blobAPI<ReadableStream<any>>(decodeURI(pathname), {
        method: 'GET'
      })
    },
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: BlobPutOptions = {}) {
      const { contentType, contentLength, ...query } = options
      const headers: Record<string, string> = {}
      if (contentType) {
        headers['content-type'] = contentType
      }
      if (contentLength) {
        headers['content-length'] = contentLength
      }
      return await blobAPI<BlobObject>(decodeURI(pathname), {
        method: 'PUT',
        headers,
        body,
        query
      })
    },
    async head(pathname: string): Promise<BlobObject> {
      return await blobAPI(`/head/${decodeURI(pathname)}`, {
        method: 'GET'
      })
    },
    async del(pathnames: string | string[]) {
      if (Array.isArray(pathnames)) {
        await blobAPI('/delete', {
          method: 'POST',
          body: {
            pathnames: pathnames.map(p => decodeURI(p))
          }
        })
      } else {
        await blobAPI(decodeURI(pathnames), {
          method: 'DELETE'
        })
      }
      return
    }
  }

  return {
    ...blob,
    delete: blob.del
  }
}

function getContentType(pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
}

function mapR2ObjectToBlob(object: R2Object): BlobObject {
  return {
    pathname: object.key,
    contentType: object.httpMetadata?.contentType,
    size: object.size,
    uploadedAt: object.uploaded
  }
}

// Credits from shared utils of https://github.com/pingdotgg/uploadthing
type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024
type SizeUnit = 'B' | 'KB' | 'MB' | 'GB'
type BlobSize = `${PowOf2}${SizeUnit}`
type BlobType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'blob' | keyof typeof extensions
const FILESIZE_UNITS = ['B', 'KB', 'MB', 'GB']
type FileSizeUnit = (typeof FILESIZE_UNITS)[number]

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
export function ensureBlob(blob: Blob, options: { maxSize?: BlobSize, types?: BlobType[] }) {
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
  if (options.types?.length && !options.types.includes(blob.type as BlobType) && !options.types.includes(blobShortType as BlobType)) {
    throw createError({
      statusCode: 400,
      message: `File type is invalid, must be: ${options.types.join(', ')}`
    })
  }
}
