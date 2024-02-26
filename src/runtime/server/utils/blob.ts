import type { extensions } from '@uploadthing/mime-types'
import slugify from '@sindresorhus/slugify'
import type { R2Bucket } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import mime from 'mime'
import type { H3Event } from 'h3'
import { setHeader, createError } from 'h3'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { parse } from 'pathe'
import { joinURL } from 'ufo'
import { useRuntimeConfig } from '#imports'

export interface BlobObject {
  pathname: string
  contentType: string | undefined
  size: number
  uploadedAt: Date
}

export interface BlobListOptions {
  /**
   * The maximum number of blobs to return per request.
   * @default 1000
   */
  limit?: number
  prefix?: string
  cursor?: string
}

export interface BlobPutOptions {
  contentType?: string,
  contentLength?: string,
  addRandomSuffix?: boolean,
  [key: string]: any
}

const _r2_buckets: Record<string, R2Bucket> = {}

function _useBucket() {
  const name = 'BLOB'
  if (_r2_buckets[name]) {
    return _r2_buckets[name]
  }

  // @ts-ignore
  const binding = process.env[name] || globalThis.__env__?.[name] || globalThis[name]
  if (binding) {
    _r2_buckets[name] = binding as R2Bucket
    return _r2_buckets[name]
  }
  throw createError(`Missing Cloudflare ${name} binding (R2)`)
}

export function hubBlob() {
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && hub.projectUrl) {
    return proxyHubBlob(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  }
  const bucket = _useBucket()

  return {
    async list(options: BlobListOptions = { limit: 1000 }) {
      const resolvedOptions = defu(options, {
        limit: 500,
        include: ['httpMetadata' as const, 'customMetadata' as const],
      })

      // https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2listoptions
      const listed = await bucket.list(resolvedOptions)
      let truncated = listed.truncated
      let cursor = listed.truncated ? listed.cursor : undefined

      while (truncated) {
        const next = await bucket.list({
          ...options,
          cursor: cursor,
        })
        listed.objects.push(...next.objects)

        truncated = next.truncated
        cursor = next.truncated ? next.cursor : undefined
      }

      return listed.objects.map(mapR2ObjectToBlob)
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
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: BlobPutOptions = { addRandomSuffix: true }) {
      pathname = decodeURI(pathname)
      const { contentType: optionsContentType, contentLength, addRandomSuffix, ...customMetadata } = options
      const contentType = optionsContentType || (body as Blob).type || getContentType(pathname)

      const { dir, ext, name: filename } = parse(pathname)
      if (addRandomSuffix) {
        pathname = joinURL(dir === '.' ? '' : dir, `${slugify(filename)}-${randomUUID().split('-')[0]}${ext}`)
      } else {
        pathname = joinURL(dir === '.' ? '' : dir, `${slugify(filename)}${ext}`)
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
    async delete(pathname: string) {
      return await bucket.delete(decodeURI(pathname))
    }
  }
}

export function proxyHubBlob(projectUrl: string, secretKey?: string) {
  const blobAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/blob'),
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  })

  return {
    async list(options: BlobListOptions = { limit: 1000 }) {
      return blobAPI<BlobObject[]>('/', {
        method: 'GET',
        query: options
      })
    },
    async serve(_event: H3Event, pathname: string) {
      return blobAPI<ReadableStreamDefaultReader<any>>(decodeURI(pathname), {
        method: 'GET'
      })
    },
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: BlobPutOptions = { addRandomSuffix: true }) {
      const { contentType, contentLength, ...query } = options
      const headers: Record<string, string> = {}
      if (contentType) { headers['content-type'] = contentType }
      if (contentLength) { headers['content-length'] = contentLength }
      return await blobAPI<BlobObject>(decodeURI(pathname), {
        method: 'PUT',
        headers,
        body,
        query
      })
    },
    async head(pathname: string) {
      const { headers } = await blobAPI.raw<void>(decodeURI(pathname), {
        method: 'HEAD'
      })
      return JSON.parse(headers.get('x-blob') || '{}') as BlobObject
    },
    async delete(pathname: string) {
      await blobAPI<void>(decodeURI(pathname), {
        method: 'DELETE',
      })
      return
    }
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
    uploadedAt: object.uploaded,
  }
}

// Credits from shared utils of https://github.com/pingdotgg/uploadthing
type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
type SizeUnit = 'B' | 'KB' | 'MB' | 'GB';
type BlobSize = `${PowOf2}${SizeUnit}`;
type BlobType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'blob' | keyof typeof extensions
const FILESIZE_UNITS = ['B', 'KB', 'MB', 'GB']
type FileSizeUnit = (typeof FILESIZE_UNITS)[number];

function fileSizeToBytes(input: string) {
  const regex = new RegExp(
    `^(\\d+)(\\.\\d+)?\\s*(${FILESIZE_UNITS.join('|')})$`,
    'i',
  )
  const match = input.match(regex)

  if (!match) {
    throw createError({ statusCode: 400, message: `Invalid file size format: ${input}` })
  }

  const sizeValue = parseFloat(match[1])
  const sizeUnit = match[3].toUpperCase() as FileSizeUnit

  if (!FILESIZE_UNITS.includes(sizeUnit)) {
    throw createError({ statusCode: 400, message: `Invalid file size unit: ${sizeUnit}` })
  }
  const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit))
  return Math.floor(bytes)
}

export function ensureBlob(blob: Blob, options: { maxSize?: BlobSize, types?: BlobType[] }) {
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
