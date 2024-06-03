import defu from 'defu'
import { randomUUID } from 'uncrypto'
import { joinURL } from 'ufo'
import { readonly, type Ref } from 'vue'
import type { FetchOptions } from 'ofetch'
import type { SerializeObject } from 'nitropack'
import type { BlobUploadedPart, BlobObject } from '../server/utils/blob'
import { useState } from '#imports'

/**
 * Create a multipart uploader.
 */
export function useMultipartUpload(
  baseURL: string,
  options?: UseMultipartUploadOptions
): MultipartUploader {
  const {
    partSize,
    concurrent,
    maxRetry,
    fetchOptions,
    prefix
  } = defu(options, {
    partSize: 10 * 1024 * 1024, // 10MB
    concurrent: 1, // no concurrent upload by default
    maxRetry: 3
  })
  const ofetch = $fetch.create({ baseURL, ...fetchOptions })
  const queryOptions = options?.fetchOptions?.query || {}

  const create = (file: File) => ofetch<{
    pathname: string
    uploadId: string
  }>(prefix ? joinURL('/create', prefix, file.name) : joinURL('/create', file.name), {
    method: 'POST'
  })

  const upload = (
    { partNumber, chunkBody }: MultipartUploadChunk,
    { pathname, uploadId }: Awaited<ReturnType<typeof create>>
  ) => ofetch<BlobUploadedPart>(`/upload/${pathname}`, {
    method: 'PUT',
    query: {
      ...queryOptions,
      uploadId,
      partNumber
    },
    body: chunkBody
  })

  const complete = (
    parts: Awaited<ReturnType<typeof upload>>[],
    { pathname, uploadId }: Awaited<ReturnType<typeof create>>
  ) => ofetch<SerializeObject<BlobObject>>(`/complete/${pathname}`,
    {
      method: 'POST',
      query: {
        ...queryOptions,
        uploadId
      },
      body: { parts }
    }
  )

  const abort = async (
    { pathname, uploadId }: Awaited<ReturnType<typeof create>>
  ) => {
    await ofetch(`/abort/${pathname}`, {
      method: 'DELETE',
      query: {
        ...queryOptions,
        uploadId
      }
    })
  }

  return (file) => {
    const data = create(file)
    const chunks = Math.ceil(file.size / partSize)

    const queue = Array.from({ length: chunks }, (_, i) => i + 1)
    const parts: Awaited<ReturnType<typeof upload>>[] = []
    const progress = useState(randomUUID(), () => 0)
    const errors: Error[] = []
    let canceled = false

    const cancel = async () => {
      if (canceled) {
        return
      }
      canceled = true
      queue.splice(0, queue.length)
      if (abort) {
        await abort(await data)
      }
    }

    const prepare = (partNumber: number) => {
      const start = (partNumber - 1) * partSize
      const end = Math.min(start + partSize, file.size)
      const chunkBody = file.slice(start, end)
      return { partNumber, chunkBody }
    }

    const process = async (partNumber: number) => {
      const prepared = prepare(partNumber)
      try {
        const part = await upload(prepared, await data)

        progress.value = parts.length / chunks * 100
        parts.push(part)
      } catch (e) {
        errors.push(e as Error)
        queue.push(partNumber)

        if (errors.length >= maxRetry) {
          cancel()
          throw new Error('Upload failed')
        }
      }

      // process next chunk
      const next = queue.shift()
      if (next) {
        await process(next)
      }
    }

    const start = async () => {
      try {
        await Promise.all(Array.from({ length: concurrent }).map(() => {
          const partNumber = queue.shift()
          if (partNumber) {
            return process(partNumber)
          }
        }))
      } catch (error) {
        return
      }
      if (canceled || parts.length < chunks) {
        return
      }

      return complete(parts, await data)
    }

    return {
      completed: start(),
      progress: readonly(progress),
      abort: cancel
    }
  }
}

interface MultipartUploadChunk {
  partNumber: number
  chunkBody: Blob
}

export interface UseMultipartUploadOptions {
  /**
   * The size of each part of the file to be uploaded.
   * @default 10 * 1024 * 1024
   */
  partSize?: number
  /**
   * The maximum number of concurrent uploads.
   * @default 1
   */
  concurrent?: number
  /**
   * The maximum number of retry attempts for the whole upload.
   * @default 3
   */
  maxRetry?: number
  /**
   * The prefix to use for the blob pathname.
   */
  prefix?: string
  /**
   * Override the ofetch options.
   * The query and headers will be merged with the options provided by the uploader.
   */
  fetchOptions?: Omit<FetchOptions, 'method' | 'baseURL' | 'body' | 'parseResponse' | 'responseType'>
}

export type MultipartUploader = (file: File) => {
  /**
   * The promise that resolves to the complete response or undefined if the upload is canceled or failed.
   */
  completed: Promise<SerializeObject<BlobObject> | undefined>
  /**
   * The progress of the upload as a number between 0 and 100.
   */
  progress: Readonly<Ref<number>>
  /**
   * Abort the upload.
   */
  abort: () => Promise<void>
}
