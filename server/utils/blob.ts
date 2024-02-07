import type { R2Bucket } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import mime from 'mime'
// import { imageMeta } from 'image-meta'
import type { H3Event } from 'h3'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { parse } from 'pathe'
import { joinURL } from 'ufo'

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

export function useBlob() {
  if (import.meta.dev && process.env.NUXT_HUB_URL) {
    return useProxyBlob(process.env.NUXT_HUB_URL, process.env.NUXT_HUB_SECRET_KEY)
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
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: { contentType?: string, contentLength?: string, addRandomSuffix?: boolean, [key: string]: any } = { addRandomSuffix: true }) {
      pathname = decodeURI(pathname)
      const { contentType: optionsContentType, contentLength, addRandomSuffix, ...customMetadata } = options
      const contentType = optionsContentType || (body as Blob).type || getContentType(pathname)

      const { dir, ext, name: filename } = parse(pathname)
      if (addRandomSuffix) {
        pathname = joinURL(dir === '.' ? '' : dir, `${filename}-${randomUUID().split('-')[0]}${ext}`)
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

export function useProxyBlob(projectUrl: string, secretKey?: string) {
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
    async put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options: { contentType?: string, contentLength?: string, addRandomSuffix?: boolean, [key: string]: any } = { addRandomSuffix: true }) {
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

function getContentType(pathOrExtension?: string) {
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

// export async function readFiles (event: any) {
//   const files = (await readMultipartFormData(event) || [])

//   // Filter only files
//   return files.filter((file) => Boolean(file.filename))
// }

// export function toArrayBuffer (buffer: Buffer) {
//   const arrayBuffer = new ArrayBuffer(buffer.length)
//   const view = new Uint8Array(arrayBuffer)
//   for (let i = 0; i < buffer.length; ++i) {
//     view[i] = buffer[i]
//   }
//   return arrayBuffer
// }

function mapR2ObjectToBlob(object: R2Object): BlobObject {
  return {
    pathname: object.key,
    contentType: object.httpMetadata?.contentType,
    size: object.size,
    uploadedAt: object.uploaded,
  }
}
