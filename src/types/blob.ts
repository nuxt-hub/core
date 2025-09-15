import type { ReadableStream, R2HTTPMetadata } from '@cloudflare/workers-types/experimental'
import type { MimeType } from '@uploadthing/mime-types'

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
   * The size of the blob in bytes.
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
  httpMetadata: R2HTTPMetadata
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
   * @see https://hub.nuxt.com/docs/features/blob#ensureblob
   */
  ensure?: BlobEnsureOptions
  /**
   * Options used for the put() method.
   * @see https://hub.nuxt.com/docs/features/blob#put
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
