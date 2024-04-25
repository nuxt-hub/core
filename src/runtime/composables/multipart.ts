import defu from 'defu'
import { randomUUID } from 'uncrypto'
import { readonly, type Ref } from 'vue'
import { useState } from '#imports'

/**
 * Create a multipart uploader.
 */
export function createMultipartUploader<
  TCreateResponse,
  TUploadResponse,
  TCompleteResponse,
> (
  options: MultipartUploaderOptions<
    TCreateResponse,
    TUploadResponse,
    TCompleteResponse
  >
): MultipartUploader<TCreateResponse, TUploadResponse, TCompleteResponse> {
  const opts = defu(options, {
    partSize: 10 * 1024 * 1024, // 10MB
    concurrent: 1, // 1 concurrent uploads
    maxRetry: 3, // max retry attempts for the whole upload
  })

  // useMultipartUpload
  return (file, optionsOverride = {}) => {
    const {
      create,
      upload,
      complete,
      abort,
      partSize,
      concurrent,
      maxRetry,
      verify,
    } = defu(optionsOverride, opts)

    const data = create(file)
    const chunks = Math.ceil(file.size / partSize)

    const queue = Array.from({ length: chunks }, (_, i) => i + 1)
    const parts: TUploadResponse[] = []
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
        await abort(await data, file)
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
        const part = await upload(prepared, await data, file)

        if (verify && !await verify(part, prepared)) {
          throw new Error('Verification failed')
        }

        progress.value = parts.length / chunks
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

      return complete(parts, await data, file)
    }

    return {
      completed: start(),
      progress: readonly(progress),
      cancel,
    }
  }
}

export interface MultipartUploadChunk {
  partNumber: number
  chunkBody: Blob
}

export interface MultipartUploaderOptions<
  TCreateResponse,
  TUploadResponse,
  TCompleteResponse,
> {
  /**
   * Provide a function to create the initial data for the upload.
   */
  create: (file: File) => Promise<TCreateResponse> | TCreateResponse
  /**
   * Provide a function to upload a chunk of the file.
   */
  upload: (
    chunk: MultipartUploadChunk,
    data: TCreateResponse,
    file: File,
  ) => Promise<TUploadResponse> | TUploadResponse
  /**
   * Provide a function to complete the upload.
   */
  complete: (
    parts: TUploadResponse[],
    data: TCreateResponse,
    file: File,
  ) => Promise<TCompleteResponse> | TCompleteResponse
  /**
   * Provide a function to abort the upload.
   */
  abort?: (data: TCreateResponse, file: File) => Promise<void> | void
  /**
   * Provide a function to verify the upload response.
   */
  verify?: (
    response: TUploadResponse,
    chunk: MultipartUploadChunk,
  ) => Promise<boolean> | boolean

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
}

export type MultipartUploader<
  TCreateResponse,
  TUploadResponse,
  TCompleteResponse,
> = (
  /**
   * The file to upload.
   */
  file: File,
  /**
   * Options to override the default options.
   */
  optionsOverride?: Partial<Omit<
    MultipartUploaderOptions<
      TCreateResponse,
      TUploadResponse,
      TCompleteResponse
    >,
    'create' | 'upload' | 'complete' | 'abort'
  >>
) => {
  /**
   * The promise that resolves to the complete response or undefined if the upload is canceled or failed.
   */
  completed: Promise<TCompleteResponse | undefined>
  /**
   * The progress of the upload as a number between 0 and 1.
   */
  progress: Readonly<Ref<number>>
  /**
   * Cancel the upload.
   */
  cancel: () => Promise<void>
}
