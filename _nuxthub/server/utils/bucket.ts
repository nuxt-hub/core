import type { R2Bucket, R2ListOptions } from '@cloudflare/workers-types/experimental'
import type { MultiPartData } from 'h3'
import mime from 'mime'
import { imageMeta } from 'image-meta'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'

const _buckets: Record<string, R2Bucket> = {}

export function useBucket (name: string = '') {
  const bucketName = name ? `BUCKET_${name.toUpperCase()}` : 'BUCKET'
  if (_buckets[bucketName]) {
    return _buckets[bucketName]
  }

  if (process.env.NUXT_HUB_URL) {
    console.log('Using R2 local (proxy for useBucket() is not yet supported)')
  }
  // @ts-ignore
  const binding = process.env[bucketName] || globalThis.__env__?.[bucketName] || globalThis[bucketName]
  if (!binding) {
    throw createError(`Missing Cloudflare R2 binding ${bucketName}`)
  }
  _buckets[bucketName] = binding as R2Bucket

  return _buckets[bucketName]
}

export function useBlob (name: string = '') {
  const proxy = import.meta.dev && process.env.NUXT_HUB_URL

  return {
    async list (options: R2ListOptions = {}) {
      if (proxy) {
        const query: Record<string, any> = {}
        if (name) { query.name = name }

        return $fetch<R2Object[]>('/api/_hub/bucket', { baseURL: proxy, method: 'GET', query })
      } else {
        const bucket = useBucket(name)

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

        return listed.objects
      }
    },
    async get (key: string) {
      if (proxy) {
        const query: Record<string, any> = {}
        if (name) { query.name = name }

        return $fetch<ReadableStreamDefaultReader<any>>(`/api/_hub/bucket/${key}`, { baseURL: proxy, method: 'GET', query })
      } else {
        const bucket = useBucket(name)
        const object = await bucket.get(key)

        if (!object) {
          throw createError({ message: 'File not found', statusCode: 404 })
        }

        // setHeader(useEvent(), 'Content-Type', object.httpMetadata!.contentType!)
        // setHeader(useEvent(), 'Content-Length', object.size)

        return object.body.getReader()
      }
    },
    async put (file: MultiPartData) {
      if (proxy) {
        // TODO
      } else {
        const bucket = useBucket(name)

        const type = file.type || getContentType(file.filename)
        // TODO: ensure key unicity
        const key = randomUUID()
        const httpMetadata = { contentType: type }
        const customMetadata: Record<string, any> = {
          ...getMetadata(type, file.data),
          filename: file.filename
        }

        return await bucket.put(key, toArrayBuffer(file.data), { httpMetadata, customMetadata })
      }
    },
    async delete (key: string) {
      if (proxy) {
        const query: Record<string, any> = {}
        if (name) { query.name = name }

        return $fetch<void>(`/api/_hub/bucket/${key}`, { baseURL: proxy, method: 'DELETE', query })
      } else {
        const bucket = useBucket(name)

        return await bucket.delete(key)
      }
    }
  }
}

// Final intentions
// export default hub.blob.uploadHandler({
//   async authorize (event) {
//     await requireUserSession(event)
//   },
//   contentType: ['image/jpg'],
//   maxFileSize: '16MB',
//   bucket: '',
//   prefix: ''
// })

function getContentType (pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
}

function getMetadata (type: string, buffer: Buffer) {
  if (type.startsWith('image/')) {
    return imageMeta(buffer) as Record<string, any>
  } else {
    return {}
  }
}

function toArrayBuffer (buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(arrayBuffer)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return arrayBuffer
}
