import type { R2Bucket, R2ListOptions } from '@cloudflare/workers-types/experimental'
import type { BlobObject } from '~/_nuxthub/types'
import mime from 'mime'
// import { imageMeta } from 'image-meta'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { parse } from 'pathe'
import { joinURL } from 'ufo'

const _buckets: Record<string, R2Bucket> = {}

function useBucket () {
  const bucketName = 'BUCKET'
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

export function useBlob () {
  const proxy = import.meta.dev && process.env.NUXT_HUB_URL

  return {
    async list (options: R2ListOptions = {}) {
      if (proxy) {
        const query: Record<string, any> = {}

        return $fetch<BlobObject[]>('/api/_hub/bucket', { baseURL: proxy, method: 'GET', query })
      } else {
        const bucket = useBucket()

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
      }
    },
    async get (key: string) {
      if (proxy) {
        const query: Record<string, any> = {}

        return $fetch<ReadableStreamDefaultReader<any>>(`/api/_hub/bucket/${key}`, { baseURL: proxy, method: 'GET', query })
      } else {
        const bucket = useBucket()
        const object = await bucket.get(key)

        if (!object) {
          throw createError({ message: 'File not found', statusCode: 404 })
        }

        // FIXME
        setHeader(useEvent(), 'Content-Type', object.httpMetadata!.contentType!)
        setHeader(useEvent(), 'Content-Length', object.size)

        return object.body.getReader()
      }
    },
    async put (pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: { contentType?: string, addRandomSuffix?: boolean, [key: string]: any } = { addRandomSuffix: true }) {
      if (proxy) {
        // TODO
      } else {
        const bucket = useBucket()
        const fileContentType = (body as Blob).type || getContentType(pathname)
        const { contentType, addRandomSuffix, ...customMetadata } = options

        const { dir, ext, name: filename } = parse(pathname)
        let key = pathname
        if (addRandomSuffix) {
          key = joinURL(dir === '.' ? '' : dir, `${filename}-${randomUUID().split('-')[0]}${ext}`)
        }

        const object = await bucket.put(key, body as any, { httpMetadata: { contentType: contentType || fileContentType }, customMetadata })

        return mapR2ObjectToBlob(object)
      }
    },
    async delete (key: string) {
      if (proxy) {
        const query: Record<string, any> = {}

        return $fetch<void>(`/api/_hub/bucket/${key}`, { baseURL: proxy, method: 'DELETE', query })
      } else {
        const bucket = useBucket()

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

// function getMetadata (filename: string, buffer: Buffer) {
//   const metadata: Record<string, any> = {
//     contentType: getContentType(filename)
//   }

//   if (metadata.contentType.startsWith('image/')) {
//     Object.assign(metadata, imageMeta(buffer))
//   }

//   return metadata
// }

function mapR2ObjectToBlob (object: R2Object): BlobObject {
  return {
    pathname: object.key,
    contentType: object.httpMetadata?.contentType,
    size: object.size,
    uploadedAt: object.uploaded,
  }
}
