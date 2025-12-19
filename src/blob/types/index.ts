import type { MimeType } from '@uploadthing/mime-types'
import type { H3Event } from 'h3'
import type { BlobDriver } from '../lib/drivers/types'
import type { FSDriverOptions } from '../lib/drivers/fs'
import type { S3DriverOptions } from '../lib/drivers/s3'
import type { VercelDriverOptions } from '../lib/drivers/vercel-blob'
import type { CloudflareDriverOptions } from '../lib/drivers/cloudflare-r2'

// Credits from shared utils of https://github.com/pingdotgg/uploadthing
export type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024
export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB'
export type BlobSize = `${PowOf2}${SizeUnit}`
export type BlobType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'blob' | MimeType
export type FileSizeUnit = 'B' | 'KB' | 'MB' | 'GB'

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
   * The size of the blob in bytes
   *
   * Some drivers do not return the size of the blob at the time of upload. This is supported in the `fs` and `cloudflare-r2` drivers.
   * In the Vercel Blob and S3 drivers, the size is missing.
   */
  size?: number
  /**
   * The blob's etag, in quotes so as to be returned as a header.
   */
  httpEtag: string | undefined
  /**
   * The date the blob was uploaded at.
   */
  uploadedAt: Date
  /**
   * The HTTP metadata of the blob.
   */
  httpMetadata: Record<string, string>
  /**
   * The custom metadata of the blob.
   */
  customMetadata: Record<string, string>
  /**
   * The URL of the blob.
   */
  url?: string
}

export interface BlobUploadedPart {
  /**
   * The number of the part.
   */
  partNumber: number
  /**
   * The etag of the part.
   */
  etag: string
}

export interface BlobMultipartUpload {
  /**
   * The pathname of the multipart upload.
   */
  readonly pathname: string
  /**
   * The upload id of the multipart upload.
   */
  readonly uploadId: string
  /**
   * Upload a single part to this multipart upload.
   */
  uploadPart(partNumber: number, value: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob): Promise<BlobUploadedPart>
  /**
   * Abort the multipart upload.
   */
  abort(): Promise<void>
  /**
   * Completes the multipart upload.
   */
  complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject>
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
   * The access level of the blob.
   */
  access?: 'public' | 'private'
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
  /**
   * The custom metadata of the blob.
   */
  customMetadata?: Record<string, string>
  /**
   * @deprecated Use customMetadata instead.
   */
  [key: string]: any
}

export interface BlobMultipartOptions {
  /**
   * The access level of the blob.
   */
  access?: 'public' | 'private'
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
  /**
   * The custom metadata of the blob.
   */
  customMetadata?: Record<string, string>
  /**
   * @deprecated Use customMetadata instead.
   */
  [key: string]: any
}

export type HandleMPUResponse
  = | {
    action: 'create'
    data: Pick<BlobMultipartUpload, 'pathname' | 'uploadId'>
  }
  | {
    action: 'upload'
    data: BlobUploadedPart
  }
  | {
    action: 'complete'
    data: BlobObject
  }
  | {
    action: 'abort'
  }

export interface BlobUploadOptions {
  /**
   * The key to get the file/files from the request form.
   * @default 'files'
   */
  formKey?: string
  /**
   * Whether to allow multiple files to be uploaded.
   * @default true
   */
  multiple?: boolean
  /**
   * Options used for the ensure() method.
   * @see https://hub.nuxt.com/docs/blob/usage#ensureblob
   */
  ensure?: BlobEnsureOptions
  /**
   * Options used for the put() method.
   * @see https://hub.nuxt.com/docs/blob/usage#put
   */
  put?: BlobPutOptions
}

export interface BlobEnsureOptions {
  /**
   * The maximum size of the blob (e.g. '1MB')
   */
  maxSize?: BlobSize
  /**
   * The allowed types of the blob (e.g. ['image/png', 'application/json', 'video'])
   */
  types?: BlobType[]
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

export interface BlobCredentialsOptions {
  /**
   * The permission of the credentials.
   * @default 'admin-read-write'
   */
  permission?: 'admin-read-write' | 'admin-read-only' | 'object-read-write' | 'object-read-only'
  /**
   * The ttl of the credentials in seconds.
   * @default 900
   */
  ttl?: number
  /**
   * The prefixes to scope the credentials to.
   */
  prefixes?: string[]
  /**
   * The pathnames to scope the credentials to.
   */
  pathnames?: string[]
}

export interface BlobCredentials {
  /**
   * The Cloudflare account id
   */
  accountId: string
  /**
   * The Cloudflare R2 bucket name
   */
  bucketName: string
  /**
   * The access key id for the R2 bucket
   */
  accessKeyId: string
  /**
   * The secret access key for the R2 bucket
   */
  secretAccessKey: string
  /**
   * The session token for the R2 bucket
   */
  sessionToken: string
}

export interface BlobStorage {
  /**
   * The instance of the blob driver
   */
  driver: BlobDriver<FSDriverOptions | S3DriverOptions | VercelDriverOptions | CloudflareDriverOptions>
  /**
   * List all the blobs in the bucket (metadata only).
   *
   * @param options The list options
   *
   * @example ```ts
   * const { blobs } = await blob.list({ limit: 10 })
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
   *   return blob.serve(event, '/my-image.jpg')
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
   * const file = await blob.put('/my-image.jpg', file)
   * ```
   */
  put(pathname: string, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob, options?: BlobPutOptions): Promise<BlobObject>
  /**
   * Get the blob metadata from the bucket.
   *
   * @param pathname The pathname of the blob
   *
   * @example ```ts
   * const blobMetadata = await blob.head('/my-image.jpg')
   * ```
   */
  head(pathname: string): Promise<BlobObject>
  /**
   * Get the blob body from the bucket.
   *
   * @param pathname The pathname of the blob
   *
   * @example ```ts
   * const file = await blob.get('/my-image.jpg')
   * ```
   */
  get(pathname: string): Promise<Blob | null>
  /**
   * Delete the blob from the bucket.
   *
   * @param pathnames The pathname of the blob
   *
   * @example ```ts
   * await blob.del('/my-image.jpg')
   * ```
   */
  del(pathnames: string | string[]): Promise<void>
  /**
   * Delete the blob from the bucket.
   *
   * @param pathnames The pathname of the blob
   *
   * @example ```ts
   * await blob.delete('/my-image.jpg')
   * ```
   */
  delete(pathnames: string | string[]): Promise<void>
  /**
   * Create a multipart upload.
   *
   * @see https://hub.nuxt.com/docs/blob/upload#createmultipartupload
   */
  createMultipartUpload(pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload>
  /**
   * Get the specified multipart upload.
   *
   * @see https://hub.nuxt.com/docs/blob/upload#resumemultipartupload
   */
  resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload>
  /**
   * Handle the multipart upload request.
   * Make sure your route includes `[action]` and `[...pathname]` params.
   *
   * @see https://hub.nuxt.com/docs/blob/upload#handlemultipartupload
   */
  handleMultipartUpload(event: H3Event, options?: BlobMultipartOptions): Promise<HandleMPUResponse>
  /**
   * Handle a file upload.
   *
   * @param event The H3 event (needed to set headers for the response)
   * @param options The upload options
   *
   * @see https://hub.nuxt.com/docs/blob/upload#handleupload
   */
  handleUpload(event: H3Event, options?: BlobUploadOptions): Promise<BlobObject[]>
}
