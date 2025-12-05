import { createStorage } from 'unstorage'
import type { Driver } from 'unstorage'
import type { BlobStorage, BlobListOptions, BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobPutOptions, BlobUploadOptions } from '../types'
import { getMultiPartDriver } from './multipart/index'
import { defu } from 'defu'
import { getContentType } from './utils'
import { setHeader, createError, assertMethod, readFormData } from 'h3'
import type { H3Event } from 'h3'
import { parse } from 'pathe'
import { joinURL } from 'ufo'
import { randomUUID } from 'uncrypto'
import { ensureBlob } from './ensure'
import { createMultipartUploadHandler } from './multipart-handler'

export type * from '../types'

export function createBlobStorage(driver: Driver): BlobStorage {
  const storage = createStorage({ driver })
  const multiPartDriver = getMultiPartDriver(driver)

  const blob = {
    ...storage,
    driver,
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
        pathname: pathname.replace(/:/g, '/'), // Convert ":" back to "/" for backwards compat with R2's blob
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
      const { contentType: optionsContentType, contentLength, addRandomSuffix, prefix } = options
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

      return await multiPartDriver.createMultipartUpload(pathname, options)
    },
    async resumeMultipartUpload(pathname: string, uploadId: string) {
      return await multiPartDriver.resumeMultipartUpload(decodeURIComponent(pathname), uploadId)
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
    handleMultipartUpload: createMultipartUploadHandler(blob as BlobStorage)
  } satisfies BlobStorage
}
